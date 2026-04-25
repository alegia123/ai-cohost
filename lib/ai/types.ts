import { z } from "zod";

export const DraftResponseSchema = z.object({
  classification: z.enum(["low_risk", "medium_risk", "high_risk"]),
  recommended_action: z.enum(["auto_eligible", "host_approval_required", "escalate_immediately"]),
  confidence: z.number().min(0).max(1),
  detected_intent: z.string(),
  guest_response: z.string(),
  internal_note: z.string(),
  can_auto_send: z.boolean(),
  missing_information: z.array(z.string()).default([])
});

export type DraftResponse = z.infer<typeof DraftResponseSchema>;
