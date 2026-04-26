import { createClient } from "@supabase/supabase-js";

interface GmailToken {
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  gmail_address: string;
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: tokenRow, error } = await supabase
    .from("gmail_tokens")
    .select("*")
    .eq("user_id", userId)
    .single<GmailToken>();

  if (error || !tokenRow) throw new Error("No Gmail token found for user");

  // Refresh if expired (with 5-min buffer)
  const expiresAt = new Date(tokenRow.token_expiry).getTime();
  if (Date.now() < expiresAt - 5 * 60 * 1000) {
    return tokenRow.access_token;
  }

  // Refresh token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokenRow.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const refreshed = await res.json();
  if (!refreshed.access_token) throw new Error("Failed to refresh Gmail token");

  await supabase
    .from("gmail_tokens")
    .update({
      access_token: refreshed.access_token,
      token_expiry: new Date(
        Date.now() + refreshed.expires_in * 1000
      ).toISOString(),
    })
    .eq("user_id", userId);

  return refreshed.access_token;
}

export async function searchGmailMessages(
  accessToken: string,
  query: string,
  maxResults = 20
): Promise<string[]> {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
  });

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const data = await res.json();
  return data.messages?.map((m: { id: string }) => m.id) ?? [];
}

export async function getGmailMessage(
  accessToken: string,
  messageId: string
): Promise<any> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return res.json();
}

export async function addGmailLabel(
  accessToken: string,
  messageId: string,
  labelName: string
): Promise<void> {
  // Get or create label
  const labelsRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/labels",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const labelsData = await labelsRes.json();
  let label = labelsData.labels?.find((l: any) => l.name === labelName);

  if (!label) {
    const createRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/labels",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: labelName }),
      }
    );
    label = await createRes.json();
  }

  // Apply label
  await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ addLabelIds: [label.id] }),
    }
  );
}

export async function sendGmailNotification(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const email = [
    `To: ${to}`,
    "Content-Type: text/plain; charset=utf-8",
    `Subject: ${subject}`,
    "",
    body,
  ].join("\n");

  const encoded = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encoded }),
    }
  );
}
