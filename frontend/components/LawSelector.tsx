"use client";

import type { Law } from "@/types";

interface LawSelectorProps {
  laws: Law[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const LAW_COLORS: Record<string, string> = {
  bgb: "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 data-[active=true]:bg-blue-700 data-[active=true]:text-white data-[active=true]:border-blue-700",
  hgb: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 data-[active=true]:bg-emerald-700 data-[active=true]:text-white data-[active=true]:border-emerald-700",
  dsgvo:
    "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100 data-[active=true]:bg-purple-700 data-[active=true]:text-white data-[active=true]:border-purple-700",
  gg: "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 data-[active=true]:bg-amber-700 data-[active=true]:text-white data-[active=true]:border-amber-700",
  arbzg:
    "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 data-[active=true]:bg-rose-700 data-[active=true]:text-white data-[active=true]:border-rose-700",
  kschg:
    "bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100 data-[active=true]:bg-cyan-700 data-[active=true]:text-white data-[active=true]:border-cyan-700",
};

const DEFAULT_COLOR =
  "bg-navy-50 text-navy-800 border-navy-200 hover:bg-navy-100 data-[active=true]:bg-navy-700 data-[active=true]:text-white data-[active=true]:border-navy-700";

export default function LawSelector({
  laws,
  selectedId,
  onSelect,
}: LawSelectorProps) {
  const handleClick = (id: string) => {
    onSelect(selectedId === id ? null : id);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-navy-400 font-['Inter']">
        Filter by Law
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by German law">
        {laws.map((law) => {
          const isActive = selectedId === law.id;
          const colorClass = LAW_COLORS[law.id] ?? DEFAULT_COLOR;

          return (
            <button
              key={law.id}
              onClick={() => handleClick(law.id)}
              data-active={isActive}
              aria-pressed={isActive}
              title={`${law.name} — ${law.name_en}`}
              className={`
                group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                border text-xs font-semibold font-['Inter'] tracking-wide
                transition-all duration-150 cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2
                ${colorClass}
              `}
            >
              <span className="uppercase">{law.id}</span>
              {isActive && (
                <span aria-hidden="true" className="text-[10px] opacity-80">
                  ×
                </span>
              )}
              {/* Tooltip */}
              <span
                role="tooltip"
                className={`
                  pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10
                  bg-navy-900 text-white text-[11px] font-normal whitespace-nowrap
                  px-2.5 py-1.5 rounded-lg shadow-legal
                  opacity-0 group-hover:opacity-100 transition-opacity duration-150
                `}
              >
                <span className="block font-semibold">{law.name}</span>
                <span className="block text-navy-300">{law.name_en}</span>
                <span
                  aria-hidden="true"
                  className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy-900"
                />
              </span>
            </button>
          );
        })}

        {selectedId && (
          <button
            onClick={() => onSelect(null)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-navy-300 text-navy-400 text-xs font-medium font-['Inter'] hover:border-navy-400 hover:text-navy-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
            aria-label="Clear law filter"
          >
            Clear filter
          </button>
        )}
      </div>
    </div>
  );
}
