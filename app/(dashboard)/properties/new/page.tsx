import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewPropertyPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  async function createProperty(formData: FormData) {
    "use server";

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { error } = await supabase.from("properties").insert({
      host_user_id: user.id,
      name: formData.get("name") as string,
      city: (formData.get("city") as string) || null,
      address: (formData.get("address") as string) || null,
      house_rules: (formData.get("house_rules") as string) || null,
      checkin_instructions: (formData.get("checkin_instructions") as string) || null,
      checkout_instructions: (formData.get("checkout_instructions") as string) || null,
      wifi_name: (formData.get("wifi_name") as string) || null,
      wifi_password: (formData.get("wifi_password") as string) || null,
      parking_details: (formData.get("parking_details") as string) || null,
      garbage_recycling: (formData.get("garbage_recycling") as string) || null,
      pet_policy: (formData.get("pet_policy") as string) || null,
      smoking_policy: (formData.get("smoking_policy") as string) || null,
      local_recommendations: (formData.get("local_recommendations") as string) || null,
      escalation_rules: (formData.get("escalation_rules") as string) || null,
      auto_send_low_risk: formData.get("auto_send_low_risk") === "on",
    });

    if (error) throw new Error(error.message);

    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl">

        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Add a property
          </h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Fill in what you know now. The more detail you add, the better the AI drafts will be.
            You can always edit this later.
          </p>

          <form action={createProperty} className="mt-8 space-y-8">

            {/* ── Basic info ── */}
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Basic info
              </legend>

              <Field label="Property name *" name="name" required placeholder="e.g. Downtown Executive Suite" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="City" name="city" placeholder="e.g. Toronto" />
                <Field label="Address" name="address" placeholder="e.g. 123 King St W, Unit 4" />
              </div>
            </fieldset>

            <Divider />

            {/* ── Check-in / check-out ── */}
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Check-in &amp; check-out
              </legend>
              <TextArea
                label="Check-in instructions"
                name="checkin_instructions"
                placeholder="e.g. Check-in is at 4:00 PM. Key lockbox is on the front door — code is 1234. Parking is in spot P2-214."
                rows={3}
              />
              <TextArea
                label="Check-out instructions"
                name="checkout_instructions"
                placeholder="e.g. Check-out is at 11:00 AM. Leave keys on the kitchen counter and ensure all windows are locked."
                rows={3}
              />
            </fieldset>

            <Divider />

            {/* ── Access details ── */}
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Access details
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Wi-Fi network name" name="wifi_name" placeholder="e.g. ExecutiveSuite_Guest" />
                <Field label="Wi-Fi password" name="wifi_password" placeholder="e.g. Welcome2026!" />
              </div>
              <TextArea
                label="Parking details"
                name="parking_details"
                placeholder="e.g. Underground parking in P2, spot 214. Fob is attached to the key ring."
                rows={2}
              />
              <TextArea
                label="Garbage &amp; recycling"
                name="garbage_recycling"
                placeholder="e.g. Green bin outside the front door. Recycling pickup is Tuesday morning."
                rows={2}
              />
            </fieldset>

            <Divider />

            {/* ── House rules ── */}
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                House rules &amp; policies
              </legend>
              <TextArea
                label="House rules"
                name="house_rules"
                placeholder="e.g. No smoking. No parties or events. Quiet hours 10 PM–8 AM. Pets require written approval."
                rows={3}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextArea
                  label="Pet policy"
                  name="pet_policy"
                  placeholder="e.g. Pets allowed with prior approval. $50 cleaning fee applies."
                  rows={2}
                />
                <TextArea
                  label="Smoking policy"
                  name="smoking_policy"
                  placeholder="e.g. No smoking inside. Designated outdoor area at the rear entrance."
                  rows={2}
                />
              </div>
            </fieldset>

            <Divider />

            {/* ── Local info ── */}
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Local recommendations
              </legend>
              <TextArea
                label="Local recommendations"
                name="local_recommendations"
                placeholder="e.g. Best coffee: Pilot Coffee on King St. Closest grocery: Loblaws on Front St (5 min walk). Nearest subway: Union Station (3 min walk)."
                rows={3}
              />
            </fieldset>

            <Divider />

            {/* ── Escalation rules ── */}
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Escalation rules
              </legend>
              <TextArea
                label="Escalation rules"
                name="escalation_rules"
                placeholder="e.g. For lockouts after 10 PM, call the emergency line at 416-555-0100. For plumbing issues, contact Mike at 416-555-0200. Never promise refunds without host approval."
                rows={3}
              />
              <p className="text-xs leading-5 text-slate-400">
                These instructions tell the AI when to escalate to you directly rather than drafting a response.
                Be specific — &quot;call the emergency number&quot; is better than &quot;escalate immediately&quot;.
              </p>
            </fieldset>

            <Divider />

            {/* ── Auto-send toggle ── */}
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Auto-send
              </legend>
              <label className="mt-4 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="auto_send_low_risk"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Auto-send low-risk replies
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    When enabled, responses classified as low-risk (Wi-Fi, directions, house rules) can be sent
                    without host review. Recommended only after you have approved at least 10 replies for this property.
                    Leave off to start.
                  </p>
                </div>
              </label>
            </fieldset>

            {/* ── Submit ── */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
              <Link
                href="/"
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="rounded-2xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 active:scale-95 transition-transform"
              >
                Save property
              </button>
            </div>

          </form>
        </div>
      </div>
    </main>
  );
}

// ── Small reusable form components ──────────────────────────────────────────

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  placeholder,
  rows = 3,
}: {
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-2.5 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </label>
  );
}

function Divider() {
  return <hr className="border-slate-100" />;
}
