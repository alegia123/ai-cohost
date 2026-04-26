import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GmailConnectButton from "./GmailConnectButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const params = await searchParams;
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
  if (!user) redirect("/login");

  // Check if Gmail is connected (use service role to read gmail_tokens)
  const { createClient } = await import("@supabase/supabase-js");
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: gmailToken } = await adminSupabase
    .from("gmail_tokens")
    .select("gmail_address, last_sync_at")
    .eq("user_id", user.id)
    .single();

  const isConnected = !!gmailToken?.gmail_address;

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your AI Co-Host integrations
        </p>
      </div>

      {/* Success / Error banners */}
      {params.connected === "gmail" && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
          ✅ Gmail connected successfully! Your inbox will sync every 5 minutes.
        </div>
      )}
      {params.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800">
          ❌ Error connecting Gmail: {params.error}. Please try again.
        </div>
      )}

      {/* Gmail Integration Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Gmail Integration
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Connect your Gmail to automatically sync Airbnb guest messages and
              generate AI draft replies.
            </p>
            {isConnected && (
              <p className="mt-2 text-xs text-slate-400">
                Connected:{" "}
                <span className="font-medium text-slate-600">
                  {gmailToken.gmail_address}
                </span>
                {gmailToken.last_sync_at && (
                  <>
                    {" · "}Last sync:{" "}
                    {new Date(gmailToken.last_sync_at).toLocaleString()}
                  </>
                )}
              </p>
            )}
          </div>
          <GmailConnectButton isConnected={isConnected} />
        </div>

        {!isConnected && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-700 mb-2">
              How it works:
            </p>
            <ol className="space-y-1 text-xs text-slate-500 list-decimal list-inside">
              <li>Click "Connect Gmail" and sign in with Google</li>
              <li>AI Co-Host monitors your inbox every 5 minutes</li>
              <li>Airbnb guest messages are detected automatically</li>
              <li>AI drafts are generated and saved to your Inbox</li>
              <li>You receive an email notification for each new message</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
