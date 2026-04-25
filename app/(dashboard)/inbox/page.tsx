import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InboxClient } from "@/components/inbox-client";

export const dynamic = "force-dynamic";

async function getDrafts() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("ai_drafts")
    .select(`
      id,
      classification,
      recommended_action,
      confidence,
      detected_intent,
      guest_response,
      internal_note,
      can_auto_send,
      missing_information,
      status,
      created_at,
      guest_messages ( body, guest_name ),
      properties ( name )
    `)
    .neq("status", "approved")
    .order("created_at", { ascending: false });

  return data || [];
}

export default async function InboxPage() {
  const drafts = await getDrafts();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Approval Inbox</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review and edit AI drafts before they become training examples. Every approval teaches the AI your tone.
        </p>
      </div>

      <InboxClient initialDrafts={drafts as any} />
    </div>
  );
}
