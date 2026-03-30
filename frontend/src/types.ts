export interface ScreeningResult {
  candidate_name: string;
  match_score: number;
  strengths: string[];
  gaps: string[];
  summary: string;
  resume_summary: string;
}

export interface ScreeningResponse {
  results: ScreeningResult[];
  job_description: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
