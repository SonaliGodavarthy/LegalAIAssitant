"use client";

import type { QueryState, Source } from "@/types";
import SourceCard from "./SourceCard";

interface AnswerPanelProps {
  state: QueryState;
  answer: string;
  sources: Source[];
  errorMessage: string | null;
}

export default function AnswerPanel({
  state,
  answer,
  sources,
  errorMessage,
}: AnswerPanelProps) {
  if (state === "idle") return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Answer card */}
      <div className="rounded-2xl border-2 border-navy-100 bg-white shadow-legal overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-navy-100 bg-navy-950">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-widest text-navy-300 font-['Inter']">
              Legal Analysis
            </span>
          </div>
          {(state === "loading" || state === "streaming") && (
            <div className="ml-auto flex items-center gap-1.5" aria-live="polite" aria-label="Researching">
              <ThinkingDots />
              <span className="text-xs text-navy-400 font-['Inter']">
                {state === "loading" ? "Retrieving documents…" : "Generating analysis…"}
              </span>
            </div>
          )}
          {state === "done" && (
            <div className="ml-auto flex items-center gap-1.5" aria-label="Analysis complete">
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-500"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-xs text-navy-400 font-['Inter']">Complete</span>
            </div>
          )}
        </div>

        {/* Answer content */}
        <div className="px-6 py-5 min-h-[80px]">
          {state === "error" ? (
            <ErrorState message={errorMessage} />
          ) : state === "loading" ? (
            <LoadingSkeleton />
          ) : (
            <div
              className={`answer-prose ${state === "streaming" ? "typing-cursor" : ""}`}
              aria-live="polite"
              aria-atomic="false"
            >
              {formatAnswer(answer)}
            </div>
          )}
        </div>
      </div>

      {/* Sources panel */}
      {sources.length > 0 && (
        <div className="animate-slide-up space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-navy-400 font-['Inter']">
              Sources Retrieved
            </h2>
            <span className="text-xs font-semibold text-white bg-navy-600 px-2 py-0.5 rounded-full font-['Inter']">
              {sources.length}
            </span>
            <div className="flex-1 h-px bg-navy-100" aria-hidden="true" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {sources.map((source, i) => (
              <SourceCard key={`${source.law}-${source.source}`} source={source} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatAnswer(text: string): React.ReactNode {
  if (!text) return null;
  // Split on double newlines for paragraphs
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  if (paragraphs.length <= 1) {
    return <p>{text}</p>;
  }
  return (
    <>
      {paragraphs.map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </>
  );
}

function ThinkingDots() {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-hidden="true"
    >
      {[0, 0.15, 0.3].map((delay, i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-typing"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading answer" role="status">
      <div className="h-4 bg-navy-100 rounded-full animate-pulse w-full" />
      <div className="h-4 bg-navy-100 rounded-full animate-pulse w-5/6" />
      <div className="h-4 bg-navy-100 rounded-full animate-pulse w-4/5" />
      <div className="h-4 bg-navy-100 rounded-full animate-pulse w-2/3" />
      <div className="h-4 bg-navy-100 rounded-full animate-pulse w-3/4" />
    </div>
  );
}

function ErrorState({ message }: { message: string | null }) {
  return (
    <div
      className="flex items-start gap-3 text-rose-700"
      role="alert"
      aria-live="assertive"
    >
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0 mt-0.5"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div>
        <p className="font-semibold font-['Inter'] text-sm">
          Unable to reach the backend
        </p>
        <p className="text-sm text-rose-600 font-['Inter'] mt-1">
          {message ?? "Please ensure the API server is running at http://localhost:8000"}
        </p>
      </div>
    </div>
  );
}
