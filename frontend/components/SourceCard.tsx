import type { Source } from "@/types";

interface SourceCardProps {
  source: Source;
  index: number;
}

const LAW_COLORS: Record<
  string,
  { badge: string; bg: string; border: string }
> = {
  bgb: {
    badge: "bg-blue-700 text-white",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  hgb: {
    badge: "bg-emerald-700 text-white",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  dsgvo: {
    badge: "bg-purple-700 text-white",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  gg: {
    badge: "bg-amber-700 text-white",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  arbzg: {
    badge: "bg-rose-700 text-white",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
  kschg: {
    badge: "bg-cyan-700 text-white",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
  },
};

const DEFAULT_COLORS = {
  badge: "bg-navy-700 text-white",
  bg: "bg-navy-50",
  border: "border-navy-200",
};

function getDocumentLabel(source: string): string {
  const map: Record<string, string> = {
    german_bgb: "BGB (German)",
    english_bgb: "BGB (English)",
    german_hgb: "HGB (German)",
    english_hgb: "HGB (English)",
    german_dsgvo: "DSGVO",
    german_gg: "GG (German)",
    english_gg: "GG (English)",
    german_arbzg: "ArbZG",
    german_kschg: "KSchG",
  };
  const key = source.replace(".pdf", "");
  return map[key] ?? source;
}

export default function SourceCard({ source, index }: SourceCardProps) {
  const colors = LAW_COLORS[source.law.toLowerCase()] ?? DEFAULT_COLORS;
  const isGerman = source.language === "german";

  return (
    <div
      className={`
        animate-slide-up flex items-start gap-3 rounded-xl border p-3.5
        ${colors.bg} ${colors.border}
        transition-shadow duration-200 hover:shadow-sm
      `}
      style={{ animationDelay: `${index * 60}ms` }}
      aria-label={`Source: ${source.law.toUpperCase()} — ${source.source}`}
    >
      {/* Law badge */}
      <span
        className={`
          flex-shrink-0 inline-block px-2.5 py-1 rounded-lg
          text-xs font-bold font-mono uppercase tracking-wider
          ${colors.badge}
        `}
      >
        {source.law.toUpperCase()}
      </span>

      {/* Source info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium font-['Inter'] text-navy-900 truncate">
          {getDocumentLabel(source.source)}
        </p>
        <p className="text-xs text-navy-500 font-['Inter'] mt-0.5 font-mono truncate">
          {source.source}
        </p>
      </div>

      {/* Language badge */}
      <span
        className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-navy-600 font-['Inter']"
        title={isGerman ? "German language document" : "English language document"}
      >
        <span aria-hidden="true">{isGerman ? "🇩🇪" : "🇬🇧"}</span>
        <span className="hidden sm:inline text-navy-400">
          {isGerman ? "DE" : "EN"}
        </span>
      </span>
    </div>
  );
}
