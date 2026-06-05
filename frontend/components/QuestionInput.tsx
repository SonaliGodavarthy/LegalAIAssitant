"use client";

import { useRef, useEffect } from "react";

interface QuestionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export default function QuestionInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: QuestionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  useEffect(() => {
    autoResize();
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !disabled && value.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-3">
      <div
        className={`
          relative rounded-2xl border-2 bg-white transition-all duration-200
          ${disabled
            ? "border-navy-200 shadow-sm"
            : "border-navy-200 hover:border-navy-300 focus-within:border-navy-500 focus-within:shadow-legal"
          }
        `}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask a follow-up or new question about German law…"
          rows={1}
          aria-label="Legal question"
          className="
            w-full resize-none rounded-2xl bg-transparent px-4 pt-3 pb-10
            text-navy-900 text-sm font-['Inter'] leading-relaxed
            placeholder:text-navy-300
            focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            custom-scrollbar
          "
          style={{ minHeight: "44px" }}
        />

        <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-3 pb-2.5">
          <span className="text-[11px] text-navy-300 font-['Inter'] select-none">
            {value.trim() && !disabled ? "⌘↵ to send" : ""}
          </span>
          <button
            onClick={onSubmit}
            disabled={!value.trim() || disabled}
            aria-label={disabled ? "Waiting for response…" : "Send question"}
            className={`
              inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl
              text-xs font-semibold font-['Inter'] tracking-wide
              transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500
              ${!value.trim() || disabled
                ? "bg-navy-100 text-navy-400 cursor-not-allowed"
                : "bg-navy-900 text-white hover:bg-navy-700 active:scale-95 shadow-sm"
              }
            `}
          >
            {disabled ? <LoadingDots /> : <SendIcon />}
            {disabled ? "Thinking" : "Ask"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[0, 0.2, 0.4].map((delay, i) => (
        <span key={i} className="w-1 h-1 bg-current rounded-full animate-typing"
          style={{ animationDelay: `${delay}s` }} />
      ))}
    </span>
  );
}
