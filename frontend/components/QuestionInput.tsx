"use client";

import { useRef, useEffect } from "react";
import type { QueryState } from "@/types";

interface QuestionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  state: QueryState;
}

const SAMPLE_QUESTIONS = [
  "What are the rules for contract termination under German law?",
  "Welche Rechte haben Arbeitnehmer bei einer Kündigung?",
  "What does the DSGVO say about data subject rights?",
  "Was regelt §242 BGB über Treu und Glauben?",
];

export default function QuestionInput({
  value,
  onChange,
  onSubmit,
  state,
}: QuestionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = state === "loading" || state === "streaming";

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  useEffect(() => {
    autoResize();
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !isLoading && value.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleSampleClick = (question: string) => {
    onChange(question);
    textareaRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      {/* Textarea wrapper */}
      <div
        className={`
          relative rounded-2xl border-2 bg-white shadow-legal
          transition-all duration-200
          ${
            isLoading
              ? "border-navy-300 shadow-glow"
              : "border-navy-200 hover:border-navy-300 focus-within:border-navy-500 focus-within:shadow-legal-lg"
          }
        `}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Ask a question about German law in English or German…"
          rows={3}
          aria-label="Legal research question"
          className={`
            w-full resize-none rounded-2xl bg-transparent px-5 pt-4 pb-12
            text-navy-900 text-base font-['Inter'] leading-relaxed
            placeholder:text-navy-300
            focus:outline-none
            disabled:opacity-60 disabled:cursor-not-allowed
            custom-scrollbar
          `}
          style={{ minHeight: "96px" }}
        />

        {/* Bottom bar inside textarea */}
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-4 pb-3">
          <p className="text-[11px] text-navy-300 font-['Inter'] select-none">
            {value.trim() ? (
              <span className="text-navy-400">
                ⌘↵ to search
              </span>
            ) : (
              "Enter your question"
            )}
          </p>

          <button
            onClick={onSubmit}
            disabled={!value.trim() || isLoading}
            aria-label={isLoading ? "Researching…" : "Research this question"}
            className={`
              inline-flex items-center gap-2 px-4 py-1.5 rounded-xl
              text-sm font-semibold font-['Inter'] tracking-wide
              transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2
              ${
                !value.trim() || isLoading
                  ? "bg-navy-100 text-navy-400 cursor-not-allowed"
                  : "bg-navy-900 text-white hover:bg-navy-700 active:scale-95 shadow-sm"
              }
            `}
          >
            {isLoading ? (
              <>
                <TypingDots />
                Researching
              </>
            ) : (
              <>
                <SearchIcon />
                Research
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sample questions */}
      {!value && state === "idle" && (
        <div className="animate-fade-in">
          <p className="text-xs text-navy-400 font-['Inter'] mb-2">
            Try asking:
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSampleClick(q)}
                className="
                  text-xs text-navy-600 font-['Inter'] px-3 py-1.5
                  bg-white border border-navy-200 rounded-lg
                  hover:bg-navy-50 hover:border-navy-300 hover:text-navy-900
                  transition-all duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400
                  text-left leading-snug
                "
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[0, 0.2, 0.4].map((delay, i) => (
        <span
          key={i}
          className="w-1 h-1 bg-current rounded-full animate-typing"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </span>
  );
}

function SearchIcon() {
  return (
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
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
