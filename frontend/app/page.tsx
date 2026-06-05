"use client";

import { useState, useEffect, useCallback } from "react";
import LawSelector from "@/components/LawSelector";
import QuestionInput from "@/components/QuestionInput";
import ChatMessages from "@/components/ChatMessages";
import type { Law, ChatMessage, Source, HistoryItem } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const SAMPLE_QUESTIONS = [
  "What are the rules for contract termination under BGB?",
  "Welche Rechte haben Arbeitnehmer bei einer Kündigung nach KSchG?",
  "What does the DSGVO say about data subject rights?",
  "Was regelt §242 BGB über Treu und Glauben?",
];

export default function HomePage() {
  const [laws, setLaws] = useState<Law[]>([]);
  const [selectedLaw, setSelectedLaw] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/laws`)
      .then((r) => r.json())
      .then((data: Law[]) => setLaws(data))
      .catch(() => {});
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed || isStreaming) return;

    // Build history from completed messages only (cap at 6 = 3 exchanges)
    const history: HistoryItem[] = messages
      .filter((m) => !m.streaming)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    const userMsgId = `u-${Date.now()}`;
    const asstMsgId = `a-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: trimmed, sources: [], streaming: false },
      { id: asstMsgId, role: "assistant", content: "", sources: [], streaming: true },
    ]);
    setQuestion("");
    setIsStreaming(true);

    try {
      const response = await fetch(`${API_BASE}/query/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          law_filter: selectedLaw ?? null,
          history,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          if (!event.trim()) continue;

          const data = event
            .split("\n")
            .filter((l) => l.startsWith("data: "))
            .map((l) => l.slice(6))
            .join("\n");

          if (!data) continue;

          if (data.startsWith("[SOURCES]")) {
            const sources = JSON.parse(data.slice(9)) as Source[];
            setMessages((prev) =>
              prev.map((m) =>
                m.id === asstMsgId ? { ...m, sources, streaming: false } : m
              )
            );
            setIsStreaming(false);
          } else if (data.startsWith("[ERROR]")) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === asstMsgId
                  ? { ...m, content: `Error: ${data.slice(7)}`, streaming: false }
                  : m
              )
            );
            setIsStreaming(false);
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === asstMsgId ? { ...m, content: m.content + data } : m
              )
            );
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === asstMsgId
            ? {
                ...m,
                content: `Unable to reach the backend: ${msg}. Make sure the API server is running.`,
                streaming: false,
              }
            : m
        )
      );
    } finally {
      // Safety net: always clear streaming state
      setMessages((prev) =>
        prev.map((m) => (m.id === asstMsgId ? { ...m, streaming: false } : m))
      );
      setIsStreaming(false);
    }
  }, [question, isStreaming, messages, selectedLaw]);

  const isEmpty = messages.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-parchment-50">
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-navy-900 via-navy-600 to-gold-500 flex-shrink-0" aria-hidden="true" />

      {/* ── Header ── */}
      <header className="flex-shrink-0 bg-white border-b border-navy-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-navy-950 flex items-center justify-center shadow-sm">
              <ScalesIcon />
            </div>
            <div>
              <h1 className="text-lg font-bold text-navy-950 font-['Playfair_Display'] leading-tight">
                German Legal Assistant
              </h1>
              <p className="text-xs text-navy-400 font-['Inter']">
                BGB · HGB · DSGVO · GG · ArbZG · KSchG
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setSelectedLaw(null); }}
                className="ml-auto text-xs text-navy-400 hover:text-navy-700 font-['Inter'] px-2.5 py-1 rounded-lg hover:bg-navy-50 transition-colors"
                aria-label="Start new conversation"
              >
                New chat
              </button>
            )}
          </div>

          {/* Law filter */}
          {laws.length > 0 && (
            <LawSelector laws={laws} selectedId={selectedLaw} onSelect={setSelectedLaw} />
          )}
        </div>
      </header>

      {/* ── Messages area ── */}
      <main className="flex-1 overflow-y-auto custom-scrollbar" aria-label="Conversation">
        {isEmpty ? (
          <EmptyState onSampleClick={(q) => { setQuestion(q); }} />
        ) : (
          <ChatMessages messages={messages} />
        )}
      </main>

      {/* ── Input bar ── */}
      <div className="flex-shrink-0 border-t border-navy-100 bg-white">
        <QuestionInput
          value={question}
          onChange={setQuestion}
          onSubmit={handleSubmit}
          disabled={isStreaming}
        />
        <p className="text-center text-[10px] text-navy-200 font-['Inter'] pb-2">
          Answers are grounded in retrieved legal text · Not legal advice · Runs fully offline
        </p>
      </div>
    </div>
  );
}

function EmptyState({ onSampleClick }: { onSampleClick: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-16 text-center space-y-8">
      <div className="space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-navy-950 flex items-center justify-center mx-auto shadow-legal">
          <ScalesIconLarge />
        </div>
        <h2 className="text-2xl font-bold text-navy-950 font-['Playfair_Display']">
          Ask about German Law
        </h2>
        <p className="text-sm text-navy-400 font-['Inter'] max-w-sm">
          Ask in English or German. Cite specific sections or describe a legal situation.
        </p>
      </div>

      <div className="space-y-2 w-full max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-navy-300 font-['Inter']">
          Try asking
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => onSampleClick(q)}
              className="text-left text-xs text-navy-600 font-['Inter'] px-3.5 py-3 bg-white border border-navy-200 rounded-xl hover:bg-navy-50 hover:border-navy-300 transition-all duration-150 leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
            >
              &ldquo;{q}&rdquo;
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScalesIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="#e8bd0e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" /><path d="M3 9l9-6 9 6" />
      <path d="M6 12l-3 6h6l-3-6z" /><path d="M18 12l-3 6h6l-3-6z" />
      <path d="M4 21h16" />
    </svg>
  );
}

function ScalesIconLarge() {
  return (
    <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="#e8bd0e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" /><path d="M3 9l9-6 9 6" />
      <path d="M6 12l-3 6h6l-3-6z" /><path d="M18 12l-3 6h6l-3-6z" />
      <path d="M4 21h16" />
    </svg>
  );
}
