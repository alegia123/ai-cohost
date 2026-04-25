"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

type Property = { id: string; name: string; city: string | null };
type DraftResult = {
  classification: string;
  recommended_action: string;
  confidence: number;
  guest_response: string;
  internal_note: string;
};

export default function ImportPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/properties")
      .then((r) => r.json())
      .then((data) => {
        setProperties(data.properties || []);
        if (data.properties?.length > 0) setPropertyId(data.properties[0].id);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!propertyId || !body.trim()) return;

    setStatus("loading");
    setError("");
    setDraft(null);

    try {
      // Step 1: Import the guest message
      const importRes = await fetch("/api/import/guest-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          guest_name: guestName || undefined,
          body,
          channel: "manual",
        }),
      });

      const importData = await importRes.json();
      if (!importRes.ok) throw new Error(importData.error || "Failed to import message.");

      const guestMessageId = importData.message.id;

      // Step 2: Generate AI draft
      const draftRes = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_message_id: guestMessageId }),
      });

      const draftData = await draftRes.json();
      if (!draftRes.ok) throw new Error(draftData.error || "Failed to generate draft.");

      setDraft(draftData.draft);
      setStatus("done");
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  }

  function reset() {
    setBody("");
    setGuestName("");
    setDraft(null);
    setStatus("idle");
    setError("");
  }

  const riskStyles: Record<string, string> = {
    low_risk:    "bg-emerald-100 text-emerald-700",
    medium_risk: "bg-amber-100 text-amber-700",
    high_risk:   "bg-red-100 text-red-700",
  };
  const riskLabels: Record<string, string> = {
    low_risk: "Low Risk", medium_risk: "Medium Risk", high_risk: "High Risk",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Import a guest message</h1>
        <p className="mt-1 text-sm text-slate-500">
          Paste a guest message and the AI will classify it and generate a draft reply instantly.
        </p>
      </div>

      {status !== "done" ? (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">

          {/* Property */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Property</label>
            {properties.length === 0 ? (
              <p className="text-sm text-slate-500">
                No properties yet.{" "}
                <a href="/properties/new" className="font-medium text-slate-900 underline underline-offset-2">
                  Add one first →
                </a>
              </p>
            ) : (
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.city ? ` — ${p.city}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Guest name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Guest name <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="e.g. Sarah M."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </div>

          {/* Message body */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Guest message *</label>
            <textarea
              required
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste the guest's message here…"
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading" || !body.trim() || !propertyId}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "loading" ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating draft…</>
            ) : (
              "Import & Generate Draft"
            )}
          </button>
        </form>
      ) : (
        /* ── Result ── */
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-800">Draft generated and saved to your inbox.</p>
          </div>

          {draft && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              {/* Classification */}
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${riskStyles[draft.classification] || "bg-slate-100 text-slate-600"}`}>
                  {riskLabels[draft.classification] || draft.classification}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {Math.round(draft.confidence * 100)}% confidence
                </span>
              </div>

              {/* Guest message */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Guest message</p>
                <p className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{body}</p>
              </div>

              {/* AI draft */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">AI draft</p>
                <p className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-800">{draft.guest_response}</p>
              </div>

              {/* Internal note */}
              {draft.internal_note && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-1">Internal note</p>
                  <p className="text-sm text-amber-800">{draft.internal_note}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/inbox")}
              className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              Review in Inbox →
            </button>
            <button
              onClick={reset}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Import another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
