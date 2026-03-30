from pydantic import BaseModel


class ScreeningResult(BaseModel):
    candidate_name: str
    match_score: int
    strengths: list[str]
    gaps: list[str]
    summary: str
    resume_summary: str = ""


class ScreeningResponse(BaseModel):
    results: list[ScreeningResult]
    job_description: str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    screening_context: str = ""


class ChatResponse(BaseModel):
    response: str
