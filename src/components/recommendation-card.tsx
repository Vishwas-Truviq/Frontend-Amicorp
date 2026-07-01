import { useState } from "react";
import { Calculator, FileText } from "lucide-react";
import type { Recommendation } from "@/lib/rec-types";
import { EstimateModal } from "./estimate-modal";
import { DiagramModal } from "./diagram-modal";

export function RecommendationCard({ rec, index = 0 }: { rec: Recommendation; index?: number }) {
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [diagramOpen, setDiagramOpen] = useState(false);

  return (
    <div
      className="group animate-fade-in-up flex flex-col justify-between rounded-lg bg-white p-5 ring-1 ring-navy-950/5 transition-all hover:shadow-md hover:ring-navy-950/15"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="space-y-4">
        {/* Header: Jurisdiction & Score */}
        <div className="flex items-start justify-between gap-2">
          <span className="rounded bg-navy-950 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            {rec.jurisdiction}
          </span>
          <div className="flex items-center gap-0.5 text-right">
            <span className="font-serif text-2xl font-bold text-amber-600">{rec.score}</span>
            <span className="text-xs text-amber-600 font-bold">%</span>
          </div>
        </div>

        {/* Title & Desc */}
        <div>
          <h3 className="font-serif text-lg font-bold text-navy-950 group-hover:text-amber-600 transition-colors leading-snug">
            {rec.entityName}
          </h3>
          {rec.desc && (
            <p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed h-8">
              {rec.desc}
            </p>
          )}
        </div>

        {/* Core Stats */}
        <div className="grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3 text-xs">
          <div>
            <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400">Setup</span>
            <span className="font-medium text-navy-950 truncate block">{rec.setupCost}</span>
          </div>
          <div>
            <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400">Annual</span>
            <span className="font-medium text-navy-950 truncate block">{rec.annualCost}</span>
          </div>
          <div>
            <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400">Time</span>
            <span className="font-medium text-navy-950 truncate block">{rec.setupTime}</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-4 flex gap-2 border-t border-zinc-100 pt-3">
        <button
          onClick={() => setEstimateOpen(true)}
          className="flex flex-1 items-center justify-center gap-1 rounded bg-zinc-50 py-1.5 px-2 text-xs font-semibold text-zinc-700 transition-all hover:bg-zinc-100 active:scale-[0.98]"
        >
          <Calculator className="size-3" />
          Estimate
        </button>
        <button
          onClick={() => setDiagramOpen(true)}
          className="flex flex-1 items-center justify-center gap-1 rounded bg-navy-900 py-1.5 px-2 text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <FileText className="size-3" />
          Diagram
        </button>
      </div>

      <EstimateModal open={estimateOpen} onOpenChange={setEstimateOpen} rec={rec} />
      <DiagramModal open={diagramOpen} onOpenChange={setDiagramOpen} rec={rec} />
    </div>
  );
}
