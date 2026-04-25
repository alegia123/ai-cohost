type PropertyContext = {
  name: string;
  city: string | null;
  house_rules: string | null;
  checkin_instructions: string | null;
  checkout_instructions: string | null;
  wifi_name: string | null;
  wifi_password: string | null;
  parking_details: string | null;
  local_recommendations: string | null;
  escalation_rules: string | null;
};

type ApprovedTemplate = {
  guest_intent: string | null;
  guest_message: string;
  approved_response: string;
};

export function buildGuestDraftPrompt({
  property,
  guestMessage,
  approvedTemplates
}: {
  property: PropertyContext;
  guestMessage: string;
  approvedTemplates: ApprovedTemplate[];
}) {
  const templateText = approvedTemplates
    .slice(0, 12)
    .map((t, index) => {
      return `Template ${index + 1}
Intent: ${t.guest_intent || "general"}
Guest: ${t.guest_message}
Approved response: ${t.approved_response}`;
    })
    .join("\n\n");

  return `
You are an AI guest-support co-host for a short-term rental.

Your job:
- Classify the guest message.
- Draft a concise, helpful guest response.
- Protect the host from operational, legal, safety, and refund risk.
- Use only the property information provided.
- Use approved templates as tone/style guidance, not as facts unless they match the property details.

Classification rules:
- low_risk: routine questions about Wi-Fi, parking, check-in, check-out, garbage, directions, local recommendations, house rules.
- medium_risk: refund, discount, compensation, cancellation, early check-in, late check-out, extra guest, pet request, complaint, cleanliness, damaged/broken item.
- high_risk: lockout, leak, flood, fire, smoke, gas, injury, police, threat, safety, break-in, electrical issue, no power, major damage.

Action rules:
- low_risk may be auto_eligible only if the answer exists in property data.
- medium_risk must be host_approval_required.
- high_risk must be escalate_immediately.
- Never promise refunds, credits, discounts, compensation, reservation changes, vendor dispatch, or policy exceptions.
- If information is missing, say you will confirm with the host.

Property:
${JSON.stringify(property, null, 2)}

Approved examples:
${templateText || "No approved templates yet."}

Guest message:
${guestMessage}

Return JSON only with:
{
  "classification": "low_risk" | "medium_risk" | "high_risk",
  "recommended_action": "auto_eligible" | "host_approval_required" | "escalate_immediately",
  "confidence": number between 0 and 1,
  "detected_intent": string,
  "guest_response": string,
  "internal_note": string,
  "can_auto_send": boolean,
  "missing_information": string[]
}
`;
}
