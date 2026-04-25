import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

async function getProperty(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("host_user_id", user.id)
    .single();

  return data;
}

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  async function updateProperty(formData: FormData) {
    "use server";
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    await supabase
      .from("properties")
      .update({
        name:                   formData.get("name") as string,
        city:                   (formData.get("city") as string) || null,
        address:                (formData.get("address") as string) || null,
        house_rules:            (formData.get("house_rules") as string) || null,
        checkin_instructions:   (formData.get("checkin_instructions") as string) || null,
        checkout_instructions:  (formData.get("checkout_instructions") as string) || null,
        wifi_name:              (formData.get("wifi_name") as string) || null,
        wifi_password:          (formData.get("wifi_password") as string) || null,
        parking_details:        (formData.get("parking_details") as string) || null,
        garbage_recycling:      (formData.get("garbage_recycling") as string) || null,
        pet_policy:             (formData.get("pet_policy") as string) || null,
        smoking_policy:         (formData.get("smoking_policy") as string) || null,
        local_recommendations:  (formData.get("local_recommendations") as string) || null,
        escalation_rules:       (formData.get("escalation_rules") as string) || null,
        auto_send_low_risk:     formData.get("auto_send_low_risk") === "on",
      })
      .eq("id", id)
      .eq("host_user_id", user.id);

    redirect("/properties");
  }

  return (
    <main className="mx-auto max-w-2xl">
      <Link href="/properties" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to properties
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Edit property</h1>
        <p className="mt-1 text-sm text-slate-500">
          Changes take effect immediately for new AI drafts. Existing drafts are not updated.
        </p>

        <form action={updateProperty} className="mt-8 space-y-8">

          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">Basic info</legend>
            <Field label="Property name *" name="name" required defaultValue={property.name} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" name="city" defaultValue={property.city} />
              <Field label="Address" name="address" defaultValue={property.address} />
            </div>
          </fieldset>

          <Divider />

          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">Check-in &amp; check-out</legend>
            <TextArea label="Check-in instructions" name="checkin_instructions" rows={3} defaultValue={property.checkin_instructions} />
            <TextArea label="Check-out instructions" name="checkout_instructions" rows={3} defaultValue={property.checkout_instructions} />
          </fieldset>

          <Divider />

          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">Access details</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Wi-Fi network name" name="wifi_name" defaultValue={property.wifi_name} />
              <Field label="Wi-Fi password" name="wifi_password" defaultValue={property.wifi_password} />
            </div>
            <TextArea label="Parking details" name="parking_details" rows={2} defaultValue={property.parking_details} />
            <TextArea label="Garbage &amp; recycling" name="garbage_recycling" rows={2} defaultValue={property.garbage_recycling} />
          </fieldset>

          <Divider />

          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">House rules &amp; policies</legend>
            <TextArea label="House rules" name="house_rules" rows={3} defaultValue={property.house_rules} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextArea label="Pet policy" name="pet_policy" rows={2} defaultValue={property.pet_policy} />
              <TextArea label="Smoking policy" name="smoking_policy" rows={2} defaultValue={property.smoking_policy} />
            </div>
          </fieldset>

          <Divider />

          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">Local recommendations</legend>
            <TextArea label="Local recommendations" name="local_recommendations" rows={3} defaultValue={property.local_recommendations} />
          </fieldset>

          <Divider />

          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">Escalation rules</legend>
            <TextArea label="Escalation rules" name="escalation_rules" rows={3} defaultValue={property.escalation_rules} />
            <p className="text-xs leading-5 text-slate-400">
              Tell the AI when to escalate to you rather than drafting a response.
            </p>
          </fieldset>

          <Divider />

          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">Auto-send</legend>
            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="auto_send_low_risk"
                defaultChecked={property.auto_send_low_risk}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900"
              />
              <div>
                <p className="text-sm font-medium text-slate-900">Auto-send low-risk replies</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  Enable only after you have approved at least 10 replies for this property.
                </p>
              </div>
            </label>
          </fieldset>

          <div className="flex items-center justify-between border-t border-slate-100 pt-6">
            <Link href="/properties" className="text-sm text-slate-500 hover:text-slate-900">Cancel</Link>
            <button
              type="submit"
              className="rounded-2xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 active:scale-95 transition-transform"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({ label, name, defaultValue, required }: { label: string; name: string; defaultValue?: string | null; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </label>
  );
}

function TextArea({ label, name, defaultValue, rows = 3 }: { label: string; name: string; defaultValue?: string | null; rows?: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-2.5 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </label>
  );
}

function Divider() {
  return <hr className="border-slate-100" />;
}
