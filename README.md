# AI Co-Host SaaS Starter

A production-oriented starter for an Airbnb / short-term-rental AI guest-support product.

## Core Features

- Supabase Auth user login
- Supabase Postgres backend database
- Multiple properties per user
- Guest message import endpoint
- OpenAI draft-generation endpoint
- Host approval inbox
- Approved reply template training loop
- Escalation / risk classification

## Recommended Stack

- Next.js App Router
- TypeScript
- Supabase Auth + Postgres
- OpenAI Responses API
- Tailwind CSS

## Environment Variables

Copy `.env.example` to `.env.local`.

```bash
cp .env.example .env.local
```

Required:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
```

## Setup

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Database

Run the SQL in:

```text
supabase/schema.sql
```

inside your Supabase SQL editor.

## Product Flow

1. Host signs in.
2. Host creates one or more properties.
3. Guest messages are imported manually, by webhook, CSV, PMS integration, Gmail, WhatsApp, or future Airbnb/PMS connector.
4. AI classifies the message.
5. AI drafts a safe guest reply.
6. High-risk and medium-risk items go to approval inbox.
7. Host approves, edits, or rejects.
8. Approved replies are saved as training examples/templates.
9. Future drafts use the approved templates to match the host/property tone.

## Important Guardrail

Do not auto-send responses involving:
- refunds
- compensation
- cancellation
- damage
- extra guests
- safety
- lockouts
- leaks
- medical/security issues
- guest disputes

Keep the first live version as **draft-only** until you have enough approved replies and operational confidence.
