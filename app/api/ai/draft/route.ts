import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai/client";
import { buildGuestDraftPrompt } from "@/lib/ai/prompt";
import { DraftResponseSchema } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { guest_message_id } = body as { guest_message_id?: string };

  if (!guest_message_id) {
    return NextResponse.json({ error: "guest_message_id is required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: message, error: messageError } = await supabase
    .from("guest_messages")
    .select("*, properties(*)")
    .eq("id", guest_message_id)
    .single();

  if (messageError || !message) {
    return NextResponse.json({ error: "Guest message not found" }, { status: 404 });
  }

  const { data: templates } = await supabase
    .from("approved_templates")
    .select("guest_intent, guest_message, approved_response")
    .eq("property_id", message.property_id)
    .order("created_at", { ascending: false })
    .limit(12);

  const prompt = buildGuestDraftPrompt({
    property: message.properties,
    guestMessage: message.body,
    approvedTemplates: templates || []
  });

  // Uses Chat Completions API (stable across all openai SDK v4.x versions).
  // Upgrade to the Responses API once you've confirmed your SDK version supports it.
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const raw = completion.choices[0].message.content;
  if (!raw) {
    return NextResponse.json({ error: "Empty response from OpenAI" }, { status: 500 });
  }

  const parsed = DraftResponseSchema.parse(JSON.parse(raw));

  const { data: draft, error: draftError } = await supabase
    .from("ai_drafts")
    .insert({
      guest_message_id,
      property_id: message.property_id,
      host_user_id: user.id,
      classification: parsed.classification,
      recommended_action: parsed.recommended_action,
      confidence: parsed.confidence,
      detected_intent: parsed.detected_intent,
      guest_response: parsed.guest_response,
      internal_note: parsed.internal_note,
      can_auto_send: parsed.can_auto_send,
      missing_information: parsed.missing_information,
      status: parsed.recommended_action === "auto_eligible" ? "ready_for_review" : "needs_review"
    })
    .select()
    .single();

  if (draftError) {
    return NextResponse.json({ error: draftError.message }, { status: 500 });
  }

  return NextResponse.json({ draft });
}
