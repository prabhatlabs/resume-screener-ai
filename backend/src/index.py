import os
import tempfile
import time

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from src.llm_service import chat_stream, extract_text_from_pdf, get_file_hash
from src.models import ChatRequest, ScreeningResponse, ScreeningResult

load_dotenv()

app = FastAPI(title="Resume Screener AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

resume_cache: dict[str, dict] = {}


@app.get("/")
async def root():
    return {"message": "Resume Screener AI API"}


@app.post("/api/screen", response_model=ScreeningResponse)
async def screen_resumes(
    files: list[UploadFile] = File(...),
    job_description: str = Form(...),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    results: list[ScreeningResult] = []

    for file in files:
        filename = file.filename or ""
        if not filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"File {filename} is not a PDF")

        content = await file.read()
        file_hash = get_file_hash(content)

        if file_hash in resume_cache:
            results.append(ScreeningResult(**resume_cache[file_hash]))
            continue

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            resume_text = extract_text_from_pdf(tmp_path)
            if not resume_text:
                results.append(
                    ScreeningResult(
                        candidate_name="Unknown",
                        match_score=0,
                        strengths=[],
                        gaps=["Could not extract text from PDF"],
                        summary="Failed to parse resume",
                    )
                )
                continue

            from llm_service import screen_resume

            analysis = screen_resume(resume_text, job_description)
            result = ScreeningResult(**analysis)
            resume_cache[file_hash] = result.model_dump()
            results.append(result)
            time.sleep(5)
        except Exception as e:
            results.append(
                ScreeningResult(
                    candidate_name="Unknown",
                    match_score=0,
                    strengths=[],
                    gaps=[f"Error processing: {str(e)}"],
                    summary="Error during screening",
                )
            )
        finally:
            os.unlink(tmp_path)

    results.sort(key=lambda x: x.match_score, reverse=True)
    return ScreeningResponse(results=results, job_description=job_description)


@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not request.screening_context:
        raise HTTPException(
            status_code=400,
            detail="No screening results available. Please screen resumes first.",
        )

    return StreamingResponse(
        chat_stream(request.message, request.screening_context),
        media_type="text/event-stream",
    )


@app.get("/api/health")
async def health():
    from llm_service import get_llm_client

    provider, _ = get_llm_client()
    api_key = os.getenv("GEMINI_API_KEY", "")
    return {
        "status": "ok",
        "provider": provider,
        "key_loaded": bool(api_key),
        "key_prefix": api_key[:10] + "..." if api_key else None,
    }
