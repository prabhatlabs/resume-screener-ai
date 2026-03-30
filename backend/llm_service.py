import os
import re
import json
import time
import hashlib
from typing import Any, Generator

import pdfplumber
from dotenv import load_dotenv

load_dotenv()


def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()


def get_file_hash(content: bytes) -> str:
    return hashlib.md5(content).hexdigest()


def get_llm_client() -> tuple[str, Any]:
    provider = os.getenv("LLM_PROVIDER", "openai")
    if provider == "openai":
        from openai import OpenAI

        return ("openai", OpenAI(api_key=os.getenv("OPENAI_API_KEY")))
    elif provider == "gemini":
        import google.generativeai as genai

        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        return ("gemini", genai)
    raise ValueError(f"Unknown LLM provider: {provider}")


def _extract_retry_delay(error: Exception) -> float:
    msg = str(error)
    match = re.search(r"retry in (\d+\.?\d*)s", msg)
    if match:
        return float(match.group(1))
    match = re.search(r'"seconds":\s*(\d+)', msg)
    if match:
        return float(match.group(1))
    return 35.0


def _call_with_retry(fn: Any, max_retries: int = 3) -> Any:
    for attempt in range(max_retries):
        try:
            return fn()
        except Exception as e:
            error_str = str(e)
            is_rate_limit = (
                "429" in error_str
                or "quota" in error_str.lower()
                or "RESOURCE_EXHAUSTED" in error_str
            )
            if is_rate_limit and attempt < max_retries - 1:
                delay = _extract_retry_delay(e)
                print(
                    f"Rate limited. Retrying in {delay:.0f}s (attempt {attempt + 1}/{max_retries})"
                )
                time.sleep(delay + 1)
            else:
                raise


SCREENING_PROMPT = """You are an expert recruiter. Analyze this resume against the job description.

JOB DESCRIPTION:
{job_description}

RESUME:
{resume_text}

Respond ONLY with valid JSON:
{{
    "candidate_name": "full name from resume",
    "match_score": <0-100>,
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "gaps": ["gap 1", "gap 2"],
    "summary": "one-line fit summary for the role",
    "resume_summary": "2-3 sentence summary of candidate's actual background: key skills, years of experience, notable projects, education"
}}"""

CHAT_SYSTEM_PROMPT = """You are a concise AI recruiter assistant. Here is the screening data:

{screening_context}

Rules:
- Answer in 2-3 short sentences max
- Use bullet points only for comparisons
- Be direct, no preamble
- Reference scores and specific data
- Always consider the job description requirements when answering"""


def screen_resume(resume_text: str, job_description: str) -> dict[str, Any]:
    provider, client = get_llm_client()
    prompt = SCREENING_PROMPT.format(
        job_description=job_description, resume_text=resume_text
    )

    if provider == "openai":

        def _call() -> dict[str, Any]:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                response_format={"type": "json_object"},
            )
            return json.loads(response.choices[0].message.content)

        return _call_with_retry(_call)

    # gemini / gemma
    def _call() -> dict[str, Any]:
        model = client.GenerativeModel("gemini-2.5-flash-lite")
        response = model.generate_content(prompt)
        text = response.text.strip()
        text = re.sub(r"^```(?:json)?\s*\n?", "", text)
        text = re.sub(r"\n?```\s*$", "", text)
        return json.loads(text)

    return _call_with_retry(_call)


def chat_with_llm(message: str, screening_context: str) -> str:
    provider, client = get_llm_client()
    system_prompt = CHAT_SYSTEM_PROMPT.format(screening_context=screening_context)

    if provider == "openai":

        def _call() -> str:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
                temperature=0.5,
            )
            return response.choices[0].message.content

        return _call_with_retry(_call)

    # gemini / gemma
    def _call() -> str:
        model = client.GenerativeModel("gemini-2.5-flash-lite")
        full_prompt = f"{system_prompt}\n\nRecruiter question: {message}"
        response = model.generate_content(full_prompt)
        return response.text

    return _call_with_retry(_call)


def chat_stream(message: str, screening_context: str) -> Generator[str, None, None]:
    provider, client = get_llm_client()
    system_prompt = CHAT_SYSTEM_PROMPT.format(screening_context=screening_context)

    if provider == "openai":
        stream = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            temperature=0.5,
            stream=True,
        )
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
        return

    # gemini
    model = client.GenerativeModel("gemini-2.5-flash-lite")
    full_prompt = f"{system_prompt}\n\nRecruiter question: {message}"
    response = model.generate_content(full_prompt, stream=True)
    for chunk in response:
        if chunk.text:
            yield chunk.text
