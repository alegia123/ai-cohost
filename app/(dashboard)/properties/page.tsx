import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

async function getProperties() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("properties")
    .select("id, name, city, address, auto_send_low_risk, created_at")
    .order("created_at", { ascending: false });

  return data || [];
}

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Properties</h1>
          <p className="mt-1 text-sm text-slate-500">
            Each property has its own knowledge base, rules, and response style.
          </p>
        </div>
        <Link
          href="/properties/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-500">No properties yet.</p>
          <Link
            href="/properties/new"
            className="mt-3 inline-block text-sm font-medium text-slate-900 underline underline-offset-2"
          >
            Add your first property →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900">{p.name}</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {[p.city, p.address].filter(Boolean).join(" · ") || "No location set"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {p.auto_send_low_risk && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    Auto-send on
                  </span>
                )}
                <Link
                  href={`/properties/${p.id}/edit`}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
