import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UploadPage from "./pages/UploadPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ChatPage from "./pages/ChatPage";
import type { ScreeningResult } from "./types";

type View = "upload" | "leaderboard" | "chat";

function App() {
  const [view, setView] = useState<View>("upload");
  const [results, setResults] = useState<ScreeningResult[]>([]);
  const [jobDescription, setJobDescription] = useState("");

  const handleResults = (newResults: ScreeningResult[], jd: string) => {
    setResults(newResults);
    setJobDescription(jd);
    setView("leaderboard");
  };

  const handleReset = () => {
    setResults([]);
    setJobDescription("");
    setView("upload");
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">Resume Screener AI</h1>
            <nav className="flex gap-4 text-sm">
              <button
                onClick={() => setView("upload")}
                className={`hover:text-primary transition-colors ${
                  view === "upload" ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                Upload
              </button>
              {results.length > 0 && (
                <>
                  <button
                    onClick={() => setView("leaderboard")}
                    className={`hover:text-primary transition-colors ${
                      view === "leaderboard" ? "text-primary font-medium" : "text-muted-foreground"
                    }`}
                  >
                    Leaderboard
                  </button>
                  <button
                    onClick={() => setView("chat")}
                    className={`hover:text-primary transition-colors ${
                      view === "chat" ? "text-primary font-medium" : "text-muted-foreground"
                    }`}
                  >
                    Chat
                  </button>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <Routes>
            <Route
              path="/"
              element={
                view === "upload" ? (
                  <UploadPage onResults={handleResults} />
                ) : view === "leaderboard" ? (
                  <LeaderboardPage
                    results={results}
                    jobDescription={jobDescription}
                    onChat={() => setView("chat")}
                    onReset={handleReset}
                  />
                ) : (
                  <ChatPage
                    results={results}
                    jobDescription={jobDescription}
                    onBack={() => setView("leaderboard")}
                  />
                )
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
