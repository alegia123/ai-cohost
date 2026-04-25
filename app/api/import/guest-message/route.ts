import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    property_id,
    channel = "manual",
    guest_name,
    guest_external_id,
    reservation_external_id,
    body: messageBody
  } = body as {
    property_id?: string;
    channel?: string;
    guest_name?: string;
    guest_external_id?: string;
    reservation_external_id?: string;
    body?: string;
  };

  if (!property_id || !messageBody) {
    return NextResponse.json({ error: "property_id and body are required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: message, error } = await supabase
    .from("guest_messages")
    .insert({
      property_id,
      host_user_id: user.id,
      channel,
      guest_name,
      guest_external_id,
      reservation_external_id,
      body: messageBody,
      status: "new"
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message });
}
