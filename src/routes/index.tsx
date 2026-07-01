import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { RecommendationCard } from "@/components/recommendation-card";
import { NoMatchState } from "@/components/no-match-state";
import type { Recommendation, RecommendResponse } from "@/lib/rec-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Advisor — Amicorp AI Structuring Assistant" },
      { name: "description", content: "Describe your structuring goal and get AI-ranked entity and jurisdiction recommendations." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [noMatch, setNoMatch] = useState(false);
  const [lastQuery, setLastQuery] = useState("");

  const analyze = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setLastQuery(query);
    setResults(null);
    setNoMatch(false);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (!res.ok) throw new Error(`Analysis failed (${res.status})`);
      const data = (await res.json()) as RecommendResponse;
      
      setResults(data.results ?? []);
      setNoMatch(!!data.noMatch || (data.results ?? []).length === 0);
      if (data.noMatch || (data.results ?? []).length === 0) {
        toast("No direct automatic match", { description: "We have forwarded your enquiry to our advisory team." });
      } else {
        toast.success("Recommendations generated", { description: `Found ${data.results?.length} optimal structure matches.` });
      }
    } catch (err) {
      toast.error("Analysis failed", { description: (err as Error).message });
      setResults([]);
      setNoMatch(true);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setQuery("");
    setResults(null);
    setNoMatch(false);
    setLastQuery("");
    toast("Analysis cleared");
  };

  return (
    <AppLayout>
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside className="col-span-12 space-y-6 lg:col-span-3">
            <div className="space-y-3">
              <h3 className="font-serif text-lg font-medium text-navy-950">Parameters</h3>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Region</label>
                <div className="flex flex-wrap gap-2">
                  {["Global", "Caribbean", "Asia Pacific", "EMEA"].map((r, i) => (
                    <span
                      key={r}
                      className={`cursor-pointer rounded-full px-3 py-1 text-xs transition-colors ${
                        i === 0
                          ? "bg-navy-900 text-white"
                          : "border border-navy-950/10 text-zinc-600 hover:bg-white"
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Intent</label>
                <div className="flex flex-wrap gap-2">
                  {["Wealth", "Funds", "Holding", "Trading"].map((r) => (
                    <span key={r} className="cursor-pointer rounded-full border border-navy-950/10 px-3 py-1 text-xs text-zinc-600 hover:bg-white">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-navy-900 p-5 text-white shadow-xl">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Market Pulse</p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                VCC registrations in Singapore rose 14% this quarter following new regulatory clarity around sub-fund segregation.
              </p>
            </div>
          </aside>

          {/* Main */}
          <div className="col-span-12 space-y-10 lg:col-span-9">
            <section className="space-y-5">
              <h1 className="max-w-[30ch] text-balance font-serif text-4xl font-medium leading-tight text-navy-950 lg:text-5xl">
                Describe your goal.
              </h1>
              <p className="max-w-2xl text-sm text-zinc-500">
                Tell us what you want to achieve. Our engine matches your intent against jurisdictions, entities, and compliance regimes worldwide.
              </p>

              <div className="relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) analyze();
                  }}
                  disabled={loading}
                  placeholder="e.g. I need to protect family assets across generations in the Middle East…"
                  rows={3}
                  className="w-full resize-none rounded-md border-none bg-white p-6 text-lg text-navy-950 shadow-sm ring-1 ring-navy-950/5 transition-shadow placeholder:text-zinc-400 focus:outline-none focus:ring-amber-600/30 disabled:opacity-75"
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  {results !== null && (
                    <button
                      onClick={reset}
                      className="inline-flex items-center gap-1.5 rounded border border-navy-950/10 bg-white py-2 px-3 text-sm font-medium text-navy-950 transition-all hover:bg-zinc-50 active:scale-[0.98]"
                    >
                      <RefreshCw className="size-4" />
                      Clear
                    </button>
                  )}
                  <button
                    onClick={analyze}
                    disabled={loading || !query.trim()}
                    className="inline-flex items-center gap-1.5 rounded bg-amber-600 py-2 pl-2 pr-3 text-sm font-medium text-white transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    {loading ? "Analyzing…" : "Generate Analysis"}
                  </button>
                </div>
              </div>
            </section>

            {loading && (
              <div className="flex items-center gap-3 text-sm text-zinc-500">
                <Loader2 className="size-4 animate-spin text-amber-600" />
                <span className="shimmer-text font-medium">Analyzing your objective across 40+ jurisdictions…</span>
              </div>
            )}

            {results !== null && !loading && (
              <section className="space-y-6">
                <div className="flex items-end justify-between border-b border-navy-950/5 pb-4">
                  <h2 className="font-serif text-2xl font-medium text-navy-950">
                    {noMatch ? "No automatic match" : "Recommended Structures"}
                  </h2>
                  {!noMatch && (
                    <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                      {results.length} Optimal Match{results.length === 1 ? "" : "es"}
                    </span>
                  )}
                </div>

                {noMatch ? (
                  <NoMatchState query={lastQuery} />
                ) : (
                  <div className="grid gap-6">
                    {results.map((r, i) => (
                      <RecommendationCard key={r.id ?? i} rec={r} index={i} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {results === null && !loading && (
              <div className="rounded-lg border border-dashed border-navy-950/10 bg-white/50 p-10 text-center">
                <p className="font-serif text-lg text-navy-950">Ready when you are.</p>
                <p className="mt-1 text-sm text-zinc-500">Enter your objective above to see ranked recommendations.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
