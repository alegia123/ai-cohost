# Implementation Notes

## Guest Message Import Options

Start manually:
- host pastes message into app
- upload CSV export
- Gmail forwarding address
- Zapier/Make webhook

Then integrate:
- PMS provider webhook
- Hostaway / Guesty / Hospitable where API access is available
- direct Airbnb should be considered later because platform access can be restrictive

## Template Training

This starter does not fine-tune a model. It uses approved host replies as retrieval examples inside the prompt.

This is the right first step because:
- safer
- cheaper
- easier to inspect
- property-specific
- no need for large training data

Fine-tuning can come later after hundreds/thousands of approved examples.

## Auto-Send Rules

Default to draft-only.

Auto-send can be enabled only when:
- classification = low_risk
- recommended_action = auto_eligible
- confidence >= 0.90
- no missing_information
- property.auto_send_low_risk = true
- answer does not include access/security-sensitive information outside approved timing rules

## Approval Queue

Every AI draft should preserve:
- original guest message
- model response
- classification
- internal note
- confidence
- host edits
- final approved response

This creates an audit trail and training loop.
