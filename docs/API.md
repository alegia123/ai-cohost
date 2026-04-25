# API Endpoints

## Import Guest Message

`POST /api/import/guest-message`

```json
{
  "property_id": "uuid",
  "channel": "manual",
  "guest_name": "Sarah",
  "guest_external_id": "optional",
  "reservation_external_id": "optional",
  "body": "Hi, can we check in early tomorrow?"
}
```

## Generate AI Draft

`POST /api/ai/draft`

```json
{
  "guest_message_id": "uuid"
}
```

Returns an AI draft and saves it to the approval inbox.

## Approve Draft

`POST /api/drafts/:id/approve`

```json
{
  "approved_response": "Hi Sarah, thank you for checking..."
}
```

Approval creates:
- approved response record
- approved template training example
- updated message/draft status

## Future Endpoints

- `POST /api/properties`
- `PATCH /api/properties/:id`
- `POST /api/integrations/pms-webhook`
- `POST /api/drafts/:id/reject`
- `POST /api/drafts/:id/send`
- `GET /api/analytics/response-time`
