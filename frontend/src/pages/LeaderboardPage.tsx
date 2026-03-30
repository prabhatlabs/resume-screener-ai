import { useState } from "react";
import { Trophy, ArrowUpDown, ThumbsUp, ThumbsDown, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import type { ScreeningResult } from "../types";

interface LeaderboardPageProps {
  results: ScreeningResult[];
  jobDescription: string;
  onChat: () => void;
  onReset: () => void;
}

type SortKey = "score" | "name";

export default function LeaderboardPage({
  results,
  jobDescription,
  onChat,
  onReset,
}: LeaderboardPageProps) {
  const [sortKey, setSortKey] = useState<SortKey>("score");

  const sorted = [...results].sort((a, b) =>
    sortKey === "score" ? b.match_score - a.match_score : a.candidate_name.localeCompare(b.candidate_name)
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "destructive";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onReset} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          New Screening
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant={sortKey === "score" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortKey("score")}
          >
            <ArrowUpDown className="h-3 w-3 mr-1" />
            Score
          </Button>
          <Button
            variant={sortKey === "name" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortKey("name")}
          >
            <ArrowUpDown className="h-3 w-3 mr-1" />
            Name
          </Button>
          <Button onClick={onChat} size="sm">
            Ask AI
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground bg-secondary rounded-md px-4 py-3">
        <strong>JD:</strong> {jobDescription.slice(0, 200)}
        {jobDescription.length > 200 ? "..." : ""}
      </div>

      <div className="space-y-4">
        {sorted.map((result, index) => (
          <Card
            key={index}
            className={index === 0 && sortKey === "score" ? "border-yellow-400 border-2" : ""}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {index === 0 && sortKey === "score" && (
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  )}
                  <CardTitle className="text-lg">{result.candidate_name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getScoreBadge(result.match_score) as any}>
                    {result.match_score}/100
                  </Badge>
                  <span className={`text-2xl font-bold ${getScoreColor(result.match_score)}`}>
                    {result.match_score}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{result.summary}</p>
              {result.resume_summary && (
                <p className="text-sm bg-secondary rounded px-3 py-2">{result.resume_summary}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1 text-sm font-medium text-green-700 mb-1">
                    <ThumbsUp className="h-3 w-3" />
                    Strengths
                  </div>
                  <ul className="text-sm space-y-1">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="text-muted-foreground">
                        • {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-sm font-medium text-red-700 mb-1">
                    <ThumbsDown className="h-3 w-3" />
                    Gaps
                  </div>
                  <ul className="text-sm space-y-1">
                    {result.gaps.map((g, i) => (
                      <li key={i} className="text-muted-foreground">
                        • {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
