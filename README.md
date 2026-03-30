# Resume Screener AI

AI-powered resume screening tool that lets recruiters upload multiple candidate resumes, rank them automatically using an LLM, and interact with the results via a chat interface.

## Tech Stack

- **Backend:** Python, FastAPI, pdfplumber, Google Gemini API
- **Frontend:** React, TypeScript, Vite, Tailwind CSS 4

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS/Linux
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```
GEMINI_API_KEY=your_key_here
LLM_PROVIDER=gemini
```

Start the server:

```bash
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API requests to the backend.

## Features

- Multi-file PDF upload with drag-and-drop
- AI-powered resume screening against a job description
- Ranked leaderboard with match scores, strengths, and gaps
- Chat interface to ask questions about candidates
- MD5-based caching to avoid re-screening the same resume
- Auto-retry on API rate limits
