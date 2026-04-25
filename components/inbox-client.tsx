"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

type Draft = {
  id: string;
  classification: string;
  recommended_action: string;
  confidence: number;
  detected_intent: string | null;
  guest_response: string;
  internal_note: string | null;
  can_auto_send: boolean;
  missing_information: string[];
  status: string;
  guest_messages: { body: string; guest_name: string | null } | null;
  properties: { name: string } | null;
};

const riskStyles: Record<string, string> = {
  low_risk:    "bg-emerald-100 text-emerald-700",
  medium_risk: "bg-amber-100 text-amber-700",
  high_risk:   "bg-red-100 text-red-700",
};
const riskLabels: Record<string, string> = {
  low_risk: "Low Risk", medium_risk: "Medium Risk", high_risk: "High Risk",
};
const actionLabels: Record<string, string> = {
  auto_eligible:           "Auto-eligible",
  host_approval_required:  "Approval required",
  escalate_immediately:    "Escalate immediately",
};

export function InboxClient({ initialDrafts }: { initialDrafts: Draft[] }) {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [editedResponses, setEditedResponses] = useState<Record<string, string>>(
    Object.fromEntries(initialDrafts.map((d) => [d.id, d.guest_response]))
  );
  const [approving, setApproving] = useState<Record<string, boolean>>({});
  const [approved, setApproved] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(initialDrafts.map((d) => [d.id, true]))
  );

  async function approveDraft(draftId: string) {
    setApproving((prev) => ({ ...prev, [draftId]: true }));
    setErrors((prev) => ({ ...prev, [draftId]: "" }));

    try {
      const res = await fetch(`/api/drafts/${draftId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_response: editedResponses[draftId] }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Approval failed.");
      }

      setApproved((prev) => ({ ...prev, [draftId]: true }));
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [draftId]: err.message }));
    } finally {
      setApproving((prev) => ({ ...prev, [draftId]: false }));
    }
  }

  const pending = drafts.filter((d) => !approved[d.id]);
  const approvedDrafts = drafts.filter((d) => approved[d.id]);

  if (drafts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <p className="text-sm text-slate-500">No drafts yet.</p>
        <a href="/import" className="mt-2 inline-block text-xs font-medium text-slate-900 underline underline-offset-2">
          Import a guest message to get started →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pending */}
      {pending.map((draft) => {
        const isExpanded = expanded[draft.id] ?? true;
        const isApproving = approving[draft.id];

        return (
          <article key={draft.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="flex flex-wrap items-start justify-between gap-3 p-5">
              <div>
                <p className="font-semibold text-slate-900">
                  {draft.properties?.name || "Property"}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  Guest: {draft.guest_messages?.guest_name || "Unknown"}{draft.detected_intent ? ` · ${draft.detected_intent}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${riskStyles[draft.classification] || "bg-slate-100 text-slate-600"}`}>
                  {riskLabels[draft.classification] || draft.classification}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {actionLabels[draft.recommended_action] || draft.recommended_action}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {Math.round(draft.confidence * 100)}% confidence
                </span>
                <button
                  onClick={() => setExpanded((prev) => ({ ...prev, [draft.id]: !isExpanded }))}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
                {/* Guest message */}
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">Guest message</p>
                  <div className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                    {draft.guest_messages?.body || "—"}
                  </div>
                </div>

                {/* AI draft — editable */}
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    AI draft <span className="normal-case font-normal text-slate-400">(edit before approving)</span>
                  </p>
                  <textarea
                    rows={4}
                    value={editedResponses[draft.id] ?? draft.guest_response}
                    onChange={(e) =>
                      setEditedResponses((prev) => ({ ...prev, [draft.id]: e.target.value }))
                    }
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                {/* Internal note */}
                {draft.internal_note && (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-1">Internal note</p>
                    <p className="text-sm text-amber-800">{draft.internal_note}</p>
                  </div>
                )}

                {/* Missing information */}
                {draft.missing_information?.length > 0 && (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Missing information</p>
                    <ul className="space-y-0.5">
                      {draft.missing_information.map((item, i) => (
                        <li key={i} className="text-sm text-slate-600">· {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Error */}
                {errors[draft.id] && (
                  <p className="text-sm text-red-600">{errors[draft.id]}</p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-slate-400">
                    Approving saves this reply as a training example for future drafts.
                  </p>
                  <button
                    onClick={() => approveDraft(draft.id)}
                    disabled={isApproving}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isApproving ? "Approving…" : "Approve + Train"}
                  </button>
                </div>
              </div>
            )}
          </article>
        );
      })}

      {/* Approved this session */}
      {approvedDrafts.length > 0 && (
        <div className="pt-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Approved this session
          </p>
          <div className="space-y-2">
            {approvedDrafts.map((draft) => (
              <div key={draft.id} className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-900 truncate">
                    {draft.properties?.name} · {draft.guest_messages?.guest_name || "Guest"}
                  </p>
                  <p className="text-xs text-emerald-700">Approved and saved as training example.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
