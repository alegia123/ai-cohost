import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { approved_response } = body as { approved_response?: string };

  if (!approved_response) {
    return NextResponse.json({ error: "approved_response is required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: draft, error: draftReadError } = await supabase
    .from("ai_drafts")
    .select("*, guest_messages(body)")
    .eq("id", id)
    .eq("host_user_id", user.id)
    .single();

  if (draftReadError || !draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  const { data: approved, error: approveError } = await supabase
    .from("approved_responses")
    .insert({
      ai_draft_id: id,
      property_id: draft.property_id,
      host_user_id: user.id,
      approved_response
    })
    .select()
    .single();

  if (approveError) {
    return NextResponse.json({ error: approveError.message }, { status: 500 });
  }

  await supabase
    .from("approved_templates")
    .insert({
      property_id: draft.property_id,
      host_user_id: user.id,
      guest_intent: draft.detected_intent,
      guest_message: draft.guest_messages.body,
      approved_response
    });

  await supabase
    .from("ai_drafts")
    .update({ status: "approved" })
    .eq("id", id)
    .eq("host_user_id", user.id);

  await supabase
    .from("guest_messages")
    .update({ status: "approved_response_ready" })
    .eq("id", draft.guest_message_id)
    .eq("host_user_id", user.id);

  return NextResponse.json({ approved });
}
