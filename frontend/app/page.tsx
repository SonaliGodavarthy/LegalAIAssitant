"use client";

import { useState, useEffect, useCallback } from "react";
import LawSelector from "@/components/LawSelector";
import QuestionInput from "@/components/QuestionInput";
import AnswerPanel from "@/components/AnswerPanel";
import type { Law, Source, QueryState } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function HomePage() {
  const [laws, setLaws] = useState<Law[]>([]);
  const [selectedLaw, setSelectedLaw] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [queryState, setQueryState] = useState<QueryState>("idle");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch available laws on mount
  useEffect(() => {
    fetch(`${API_BASE}/laws`)
      .then((r) => r.json())
      .then((data: Law[]) => setLaws(data))
      .catch(() => {
        // Non-fatal: app works without law chips
      });
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed || queryState === "loading" || queryState === "streaming") return;

    setQueryState("loading");
    setAnswer("");
    setSources([]);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE}/query/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(
          (detail as { detail?: string }).detail ?? `HTTP ${response.status}`
        );
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let firstTokenReceived = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split on SSE event boundaries (\n\n)
        const events = buffer.split("\n\n");
        // Last element may be incomplete — keep it in buffer
        buffer = events.pop() ?? "";

        for (const event of events) {
          if (!event.trim()) continue;

          // Extract data lines (handle multi-line data fields per SSE spec)
          const dataLines = event
            .split("\n")
            .filter((line) => line.startsWith("data: "))
            .map((line) => line.slice("data: ".length));

          const data = dataLines.join("\n");
          if (!data) continue;

          if (data.startsWith("[SOURCES]")) {
            // Final event — parse sources JSON
            try {
              const parsed = JSON.parse(data.slice("[SOURCES]".length)) as Source[];
              setSources(parsed);
            } catch {
              // malformed sources — silently ignore
            }
            setQueryState("done");
          } else if (data.startsWith("[ERROR]")) {
            throw new Error(data.slice("[ERROR]".length));
          } else {
            // Regular token — append to answer
            if (!firstTokenReceived) {
              firstTokenReceived = true;
              setQueryState("streaming");
            }
            setAnswer((prev) => prev + data);
          }
        }
      }

      setQueryState("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(msg);
      setQueryState("error");
    }
  }, [question, queryState]);

  return (
    <div className="min-h-screen bg-grid-pattern">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-navy-900 via-navy-600 to-gold-500" aria-hidden="true" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">

        {/* ── Header ── */}
        <header className="text-center space-y-3">
          {/* Seal / icon */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-navy-950 shadow-legal-lg mb-2">
            <ScalesIcon />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-navy-950 font-['Playfair_Display'] tracking-tight">
              Deutsches Rechts-Assistent
            </h1>
            <p className="mt-2 text-base text-navy-500 font-['Inter'] font-light">
              AI-powered German Legal Research &mdash; BGB &bull; HGB &bull; DSGVO &bull; GG &bull; ArbZG &bull; KSchG
            </p>
          </div>
        </header>

        {/* ── Main research card ── */}
        <main
          className="rounded-3xl border border-navy-200 bg-white/80 backdrop-blur-sm shadow-legal-lg p-6 sm:p-8 space-y-6"
          aria-label="Legal research interface"
        >

          {/* Law selector */}
          {laws.length > 0 && (
            <section aria-label="Filter by law">
              <LawSelector
                laws={laws}
                selectedId={selectedLaw}
                onSelect={setSelectedLaw}
              />
            </section>
          )}

          {/* Divider */}
          {laws.length > 0 && (
            <div className="h-px bg-gradient-to-r from-transparent via-navy-200 to-transparent" aria-hidden="true" />
          )}

          {/* Question input */}
          <section aria-label="Research question">
            <label className="block text-xs font-semibold uppercase tracking-widest text-navy-400 font-['Inter'] mb-3">
              Your Question
            </label>
            <QuestionInput
              value={question}
              onChange={setQuestion}
              onSubmit={handleSubmit}
              state={queryState}
            />
          </section>
        </main>

        {/* ── Answer panel ── */}
        <section aria-label="Research results" aria-live="polite">
          <AnswerPanel
            state={queryState}
            answer={answer}
            sources={sources}
            errorMessage={errorMessage}
          />
        </section>

        {/* ── Footer ── */}
        <footer className="text-center text-xs text-navy-300 font-['Inter'] space-y-1 pt-4">
          <p>
            Answers are grounded in retrieved legal text and do not constitute legal advice.
          </p>
          <p className="text-navy-200">
            Powered by Mistral &bull; ChromaDB &bull; LangChain &bull; Runs entirely offline
          </p>
        </footer>

      </div>
    </div>
  );
}

function ScalesIcon() {
  return (
    <svg
      aria-hidden="true"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#e8bd0e"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v18" />
      <path d="M3 9l9-6 9 6" />
      <path d="M6 12l-3 6h6l-3-6z" />
      <path d="M18 12l-3 6h6l-3-6z" />
      <path d="M4 21h16" />
    </svg>
  );
}
