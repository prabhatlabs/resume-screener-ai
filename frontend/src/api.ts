const API_BASE = "/api";

export async function screenResumes(
  files: File[],
  jobDescription: string
): Promise<import("./types").ScreeningResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("job_description", jobDescription);

  const res = await fetch(`${API_BASE}/screen`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Screening failed" }));
    throw new Error(err.detail || "Screening failed");
  }

  return res.json();
}

export async function sendChatMessage(
  message: string,
  screeningContext: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, screening_context: screeningContext }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Chat failed" }));
    throw new Error(err.detail || "Chat failed");
  }

  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        const text = decoder.decode(value, { stream: true });
        if (text) onChunk(text);
      }
    }
    // Flush any remaining bytes
    const remaining = decoder.decode();
    if (remaining) onChunk(remaining);
  } finally {
    reader.releaseLock();
  }
}
