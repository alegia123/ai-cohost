import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getValidAccessToken,
  searchGmailMessages,
  getGmailMessage,
  addGmailLabel,
  sendGmailNotification,
} from "@/lib/gmail";
import { isAirbnbMessageEmail, parseAirbnbEmail } from "@/lib/airbnb-parser";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LABEL_NAME = "ai-cohost-processed";
const GMAIL_QUERY =
  'from:airbnb.com (subject:"message" OR subject:"inquiry" OR subject:"booking request") -label:ai-cohost-processed newer_than:7d';

async function syncForUser(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(userId);
  } catch {
    return { userId, processed: 0, error: "no_token" };
  }

  const messageIds = await searchGmailMessages(accessToken, GMAIL_QUERY, 20);
  let processed = 0;

  for (const messageId of messageIds) {
    try {
      const message = await getGmailMessage(accessToken, messageId);

      if (!isAirbnbMessageEmail(message)) {
        await addGmailLabel(accessToken, messageId, LABEL_NAME);
        continue;
      }

      const parsed = parseAirbnbEmail(message);

      // Get user's properties for context
      const { data: properties } = await supabase
        .from("properties")
        .select("id, name, house_rules, amenities")
        .eq("user_id", userId)
        .limit(3);

      const propertyContext =
        properties
          ?.map((p: any) => `Property: ${p.name}\nRules: ${p.house_rules ?? "None"}\nAmenities: ${p.amenities ?? "None"}`)
          .join("\n\n") ?? "No properties found.";

      // Generate AI draft
      const openaiRes = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a professional Airbnb host assistant. Write warm, helpful replies to guest messages.

Property context:
${propertyContext}

Keep replies concise (2-4 sentences), friendly, and professional.`,
              },
              {
                role: "user",
                content: `Guest: ${parsed.guestName}
Message: ${parsed.messageBody}
${parsed.reservationCode ? `Reservation: ${parsed.reservationCode}` : ""}
${parsed.checkIn ? `Check-in: ${parsed.checkIn}` : ""}
${parsed.checkOut ? `Check-out: ${parsed.checkOut}` : ""}

Write a reply draft.`,
              },
            ],
            max_tokens: 300,
          }),
        }
      );

      const aiData = await openaiRes.json();
      const draftReply =
        aiData.choices?.[0]?.message?.content ?? "Unable to generate draft.";

      // Save to inbox
      await supabase.from("messages").insert({
        user_id: userId,
        guest_name: parsed.guestName,
        message: parsed.messageBody,
        ai_draft: draftReply,
        source: "gmail",
        reservation_code: parsed.reservationCode,
        check_in: parsed.checkIn,
        check_out: parsed.checkOut,
        gmail_message_id: messageId,
        status: "pending",
      });

      // Send notification email to host
      const { data: tokenRow } = await supabase
        .from("gmail_tokens")
        .select("gmail_address")
        .eq("user_id", userId)
        .single();

      if (tokenRow?.gmail_address) {
        await sendGmailNotification(
          accessToken,
          tokenRow.gmail_address,
          `AI Co-Host: New message from ${parsed.guestName}`,
          `New Airbnb message from ${parsed.guestName}\n\n${parsed.messageBody}\n\n---\nAI Draft Reply:\n${draftReply}\n\nView in AI Co-Host dashboard.`
        );
      }

      // Mark as processed
      await addGmailLabel(accessToken, messageId, LABEL_NAME);
      processed++;
    } catch (err) {
      console.error(`Error processing message ${messageId}:`, err);
    }
  }

  // Update last sync time
  await supabase
    .from("gmail_tokens")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("user_id", userId);

  return { userId, processed };
}

// GET — called by Vercel Cron
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: tokens } = await supabase
    .from("gmail_tokens")
    .select("user_id");

  const results = await Promise.allSettled(
    (tokens ?? []).map((t: any) => syncForUser(t.user_id))
  );

  return NextResponse.json({ results: results.map((r) => r) });
}

// POST — manual sync triggered by user
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncForUser(user.id);
  return NextResponse.json(result);
}
