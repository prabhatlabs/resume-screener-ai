import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, ArrowLeft, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { sendChatMessage } from "../api";
import type { ChatMessage, ScreeningResult } from "../types";

interface ChatPageProps {
  results: ScreeningResult[];
  jobDescription: string;
  onBack: () => void;
}

export default function ChatPage({ results, jobDescription, onBack }: ChatPageProps) {
  const screeningContext = JSON.stringify(
    { job_description: jobDescription, candidates: results },
    null,
    2
  );

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I've analyzed the screened resumes. Ask me anything about the candidates.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: text };
    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      await sendChatMessage(text, screeningContext, (chunk) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = {
              role: "assistant",
              content: last.content + chunk,
            };
          }
          return updated;
        });
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to get response";
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant" && !last.content) {
          updated[updated.length - 1] = { role: "assistant", content: errorMsg };
        }
        return updated;
      });
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Leaderboard
        </Button>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Chat
        </h2>
      </div>

      <Card className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0"
              }`}
            >
              {msg.role === "assistant" ? (
                msg.content ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : isLoading && i === messages.length - 1 ? (
                  <div className="flex items-center gap-1 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.3s]" />
                  </div>
                ) : null
              ) : (
                msg.content
              )}
            </div>
            {msg.role === "user" && (
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </Card>

      <div className="mt-4 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about candidates..."
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-12 focus:outline-none focus:ring-2 focus:ring-ring"
          rows={1}
        />
        <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className="h-12 w-12">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
