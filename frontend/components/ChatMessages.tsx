"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types";
import SourceCard from "./SourceCard";

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 py-6 max-w-3xl mx-auto w-full">
      {messages.map((msg) =>
        msg.role === "user" ? (
          <UserBubble key={msg.id} content={msg.content} />
        ) : (
          <AssistantBubble key={msg.id} message={msg} />
        )
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end animate-fade-in">
      <div className="max-w-[80%] bg-navy-900 text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm">
        <p className="text-sm font-['Inter'] leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

function AssistantBubble({ message }: { message: ChatMessage }) {
  const isEmpty = !message.content && message.streaming;

  return (
    <div className="flex justify-start animate-fade-in">
      <div className="max-w-[90%] w-full">
        {/* Bubble */}
        <div className="bg-white border border-navy-100 rounded-2xl rounded-tl-sm shadow-legal overflow-hidden">
          {/* Header strip */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-navy-50 bg-navy-950">
            <div className="w-1.5 h-1.5 rounded-full bg-gold-400" aria-hidden="true" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-navy-400 font-['Inter']">
              Legal Analysis
            </span>
            {message.streaming && (
              <span className="ml-auto flex items-center gap-1" aria-live="polite">
                <ThinkingDots />
              </span>
            )}
          </div>

          {/* Content */}
          <div className="px-4 py-4 min-h-[60px]">
            {isEmpty ? (
              <LoadingSkeleton />
            ) : (
              <div
                className={`answer-prose text-navy-900${message.streaming ? " typing-cursor" : ""}`}
                aria-live="polite"
              >
                {formatAnswer(message.content)}
              </div>
            )}
          </div>
        </div>

        {/* Sources */}
        {message.sources.length > 0 && (
          <div className="mt-3 space-y-2 animate-slide-up">
            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-navy-400 font-['Inter']">
                Sources
              </span>
              <span className="text-[10px] font-bold text-white bg-navy-600 px-1.5 py-0.5 rounded-full font-['Inter']">
                {message.sources.length}
              </span>
              <div className="flex-1 h-px bg-navy-100" aria-hidden="true" />
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {message.sources.map((src, i) => (
                <SourceCard key={`${src.law}-${src.source}`} source={src} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatAnswer(text: string): React.ReactNode {
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  if (paragraphs.length <= 1) return <p>{text}</p>;
  return <>{paragraphs.map((p, i) => <p key={i}>{p}</p>)}</>;
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[0, 0.15, 0.3].map((delay, i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-typing"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2.5" role="status" aria-label="Thinking">
      <div className="h-3.5 bg-navy-100 rounded-full animate-pulse w-full" />
      <div className="h-3.5 bg-navy-100 rounded-full animate-pulse w-5/6" />
      <div className="h-3.5 bg-navy-100 rounded-full animate-pulse w-4/5" />
    </div>
  );
}
