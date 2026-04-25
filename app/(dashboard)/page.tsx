import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Building2, CheckCircle2, Inbox, ShieldAlert } from "lucide-react";
import Link from "next/link";

async function getDashboardData() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [properties, messages, drafts, templates] = await Promise.all([
    supabase.from("properties").select("id, name, city, created_at").order("created_at", { ascending: false }),
    supabase.from("guest_messages").select("id").order("created_at", { ascending: false }),
    supabase.from("ai_drafts")
      .select("id, status, classification, recommended_action, guest_response, internal_note, created_at, guest_messages(body, guest_name), properties(name)")
      .neq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("approved_templates").select("id").order("created_at", { ascending: false }),
  ]);

  return {
    properties: properties.data || [],
    messageCount: messages.data?.length || 0,
    pendingDrafts: drafts.data || [],
    templateCount: templates.data?.length || 0,
  };
}

export default async function DashboardPage() {
  const { properties, messageCount, pendingDrafts, templateCount } = await getDashboardData();

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of your properties, messages, and drafts.</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Properties" value={properties.length} href="/properties" />
        <MetricCard label="Messages" value={messageCount} href="/import" />
        <MetricCard label="Pending Review" value={pendingDrafts.length} href="/inbox" highlight={pendingDrafts.length > 0} />
        <MetricCard label="Templates Trained" value={templateCount} href="/inbox" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Pending drafts preview */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Pending Approvals</h2>
              <p className="mt-0.5 text-sm text-slate-500">Drafts waiting for your review.</p>
            </div>
            <Link href="/inbox" className="text-xs font-medium text-slate-500 hover:text-slate-900">
              View all →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {pendingDrafts.length === 0 ? (
              <EmptyState text="No pending drafts. Import a guest message to get started." cta={{ label: "Import a message", href: "/import" }} />
            ) : (
              pendingDrafts.map((draft) => (
                <article key={draft.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {(draft.properties as any)?.name || "Property"}
                      {" · "}
                      <span className="text-slate-500">{(draft.guest_messages as any)?.guest_name || "Guest"}</span>
                    </p>
                    <RiskBadge level={draft.classification} />
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-600">{(draft.guest_messages as any)?.body}</p>
                  <Link
                    href="/inbox"
                    className="mt-2 inline-block text-xs font-medium text-slate-500 hover:text-slate-900"
                  >
                    Review draft →
                  </Link>
                </article>
              ))
            )}
          </div>
        </section>

        {/* Properties sidebar */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Properties</h2>
            <Link href="/properties/new" className="text-xs font-medium text-slate-500 hover:text-slate-900">
              + Add
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {properties.length === 0 ? (
              <EmptyState text="No properties yet." cta={{ label: "Add your first property", href: "/properties/new" }} />
            ) : (
              properties.map((p) => (
                <Link
                  key={p.id}
                  href={`/properties/${p.id}/edit`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.city || "No city set"}</p>
                  </div>
                  <span className="text-xs text-slate-400">Edit →</span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, href, highlight }: { label: string; value: number; href: string; highlight?: boolean }) {
  return (
    <Link href={href} className={`rounded-2xl border p-5 shadow-sm transition-colors hover:bg-slate-50 ${highlight ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${highlight ? "text-amber-700" : "text-slate-950"}`}>{value}</p>
    </Link>
  );
}

function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    low_risk:    "bg-emerald-100 text-emerald-700",
    medium_risk: "bg-amber-100 text-amber-700",
    high_risk:   "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    low_risk: "Low", medium_risk: "Medium", high_risk: "High",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[level] || "bg-slate-100 text-slate-600"}`}>
      {labels[level] || level}
    </span>
  );
}

function EmptyState({ text, cta }: { text: string; cta?: { label: string; href: string } }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
      <p className="text-sm text-slate-500">{text}</p>
      {cta && (
        <Link href={cta.href} className="mt-2 inline-block text-xs font-medium text-slate-900 underline underline-offset-2">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
