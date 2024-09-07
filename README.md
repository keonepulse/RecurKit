# RecurKit

RecurKit is a full-stack starter for building a SaaS product with recurring subscription payments. It pairs a Next.js (App Router) frontend with Supabase for authentication and PostgreSQL data, and Stripe for checkout, billing, and the customer portal — with webhooks keeping pricing plans and subscription statuses automatically in sync.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Setup](#setup)
  - [1. Create a Supabase Project](#1-create-a-supabase-project)
  - [2. Configure Auth](#2-configure-auth)
  - [3. Environment Variables](#3-environment-variables)
  - [4. Configure Stripe](#4-configure-stripe)
- [Develop Locally](#develop-locally)
  - [Local Supabase](#local-supabase)
  - [Stripe Webhook Forwarding](#stripe-webhook-forwarding)
  - [Run the App](#run-the-app)
- [Going Live](#going-live)
- [Available Scripts](#available-scripts)
- [License](#license)

## Features

- Secure user management and authentication with Supabase Auth (email, magic links, OAuth providers)
- Data access and management on top of PostgreSQL via Supabase
- Stripe Checkout integration for subscription purchase
- Stripe Customer Portal for self-service plan changes, payment methods, and cancellation
- Automatic syncing of products, prices, and subscription statuses via Stripe webhooks
- Account page with subscription management
- Pricing page rendered from live product data in the database
- Dark UI built with Tailwind CSS and Radix primitives

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Auth & Database | Supabase (Auth, PostgreSQL, generated types) |
| Payments | Stripe (Checkout, Customer Portal, Webhooks) |
| Styling | Tailwind CSS, Radix UI, Lucide icons |
| Tooling | pnpm, Supabase CLI, Stripe CLI, Prettier, ESLint |

## Architecture

```
┌──────────────┐   auth/session    ┌──────────────────┐
│   Browser    │ ◄───────────────► │     Supabase     │
│              │                   │ Auth + Postgres  │
└──────┬───────┘                   └────────▲─────────┘
       │                                    │ sync products/prices/
       ▼                                    │ subscriptions
┌──────────────────────┐   webhooks   ┌─────┴───────────┐
│  Next.js app         │ ◄─────────── │     Stripe      │
│  (server components  │ ───────────► │ Checkout/Portal │
│   + /api/webhooks)   │   API calls  └─────────────────┘
└──────────────────────┘
```

- Users authenticate through Supabase; sessions are handled with server-side cookies via middleware.
- Checkout and portal sessions are created server-side with the Stripe secret key.
- A webhook endpoint (`/api/webhooks`) receives Stripe events and syncs products, prices, customers, and subscription statuses into the database, so the pricing page and account page always reflect reality.

## Project Structure

```
.
├── app/                  # App Router pages (landing, signin, account) + /api/webhooks
├── components/           # UI components (Navbar, Footer, Pricing, forms, toasts)
├── utils/
│   ├── supabase/         # Supabase clients (server/client/middleware) and queries
│   ├── stripe/           # Stripe config and server helpers
│   └── helpers.ts        # URL helpers and misc utilities
├── supabase/             # Supabase config and SQL migrations
├── fixtures/             # Stripe fixtures for bootstrapping test products
├── schema.sql            # Database schema (manual setup)
├── types_db.ts           # Generated database types
└── middleware.ts         # Auth session refresh
```

## Setup

The order of these steps matters — follow them in sequence.

### 1. Create a Supabase Project

Create a Supabase account and a new project. Then initialize the database schema using either:

- The SQL migrations in `supabase/migrations/`, or
- The SQL editor in your Supabase dashboard: paste the contents of `schema.sql` and run it.

Confirm the tables were created in your project's table editor.

### 2. Configure Auth

Set up at least one auth method in your Supabase project (email/password works out of the box; OAuth providers such as GitHub require creating an OAuth app and adding its credentials to Supabase).

In your Supabase auth URL configuration:

- Set your production URL as the **Site URL**.
- For deploy previews to work, add a redirect wildcard for your hosting provider's preview URLs (e.g. `https://*-username.vercel.app/**`).

Set a `NEXT_PUBLIC_SITE_URL` environment variable in your production deployment pointing to the same URL (production environment only, so previews and local dev keep working).

### 3. Environment Variables

Copy the templates and fill in the values:

```bash
cp .env.local.example .env.local
cp .env.example .env
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (test mode for development) |
| `STRIPE_SECRET_KEY` | Stripe secret key (server only) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `NEXT_PUBLIC_SITE_URL` | Production site URL |

### 4. Configure Stripe

Use **test mode** for everything below until you're ready to go live.

**Create a webhook** — in the Stripe dashboard's developer webhooks section:

1. Add an endpoint with your deployment URL followed by `/api/webhooks`.
2. Select all events.
3. Copy the **signing secret** (`whsec_...` — not the webhook id `we_...`) into the `STRIPE_WEBHOOK_SECRET` env var.
4. Redeploy your app so all env vars take effect (without build cache).

**Create products and prices** — with the webhook live, any products you create in the Stripe dashboard sync automatically into your database. Stripe Checkout supports a predefined amount billed at a specific interval; for example:

- Product 1: Hobby — 10 USD/month, 100 USD/year
- Product 2: Freelancer — 20 USD/month, 200 USD/year

To bootstrap test data quickly, the included fixtures file creates products and prices for you via the Stripe CLI:

```bash
pnpm stripe:fixtures
```

**Configure the Customer Portal** — in Stripe's billing portal settings:

1. Set your custom branding.
2. Allow customers to update payment methods, update subscriptions, and cancel subscriptions.
3. Add the products and prices you want available.
4. Fill in the required business information and links.

That's it — you're ready to earn recurring revenue.

## Develop Locally

Ensure you have pnpm installed, then:

```bash
pnpm install
```

### Local Supabase

Using a local Supabase instance for development is highly recommended. Install Docker, then:

```bash
pnpm supabase:start
```

The terminal output prints URLs for the local Supabase stack, including Supabase Studio. Copy the printed `service_role_key` into `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. You can reprint the URLs anytime with `pnpm supabase:status`.

Link the local instance to your hosted project (you'll be prompted for your database password):

```bash
pnpm supabase:link
```

Useful workflows once linked:

```bash
pnpm supabase:pull                # pull remote schema changes
pnpm supabase:generate-seed       # dump remote data to supabase/seed.sql
pnpm supabase:reset               # apply migrations + seed locally
pnpm supabase:generate-types      # regenerate types_db.ts from your schema
pnpm supabase:generate-migration  # create a migration from local schema changes
pnpm supabase:push                # push migrations to the remote database
```

> **Warning:** linking connects local development to your production project. That's fine while it only contains test records, but once real customer data exists, use a separate staging/preview environment (or database branching) and test all schema changes there first.

### Stripe Webhook Forwarding

Log in to Stripe and start local webhook forwarding in its own terminal:

```bash
pnpm stripe:login
pnpm stripe:listen
```

`stripe:listen` prints a webhook secret (`whsec_...`) — set it as `STRIPE_WEBHOOK_SECRET` in `.env.local`, along with your test-mode `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`.

### Run the App

In a separate terminal:

```bash
pnpm dev
```

Webhook forwarding and the dev server must run concurrently. Open `http://localhost:3000`.

## Going Live

1. **Archive test products** in Stripe before creating live ones.
2. **Switch to live keys** — production-mode Stripe API keys differ from test mode, and you need a separate production webhook endpoint. Replace the test values in your hosting provider's environment variables.
3. **Redeploy** without build cache for the changes to take effect.
4. **Verify** — the Stripe test card should *no longer* work in production mode.

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start the Next.js dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build and serve |
| `pnpm lint` / `pnpm prettier-fix` | Lint and format |
| `pnpm stripe:login` / `stripe:listen` / `stripe:fixtures` | Stripe CLI auth, webhook forwarding, test data |
| `pnpm supabase:start` / `stop` / `status` / `restart` | Manage the local Supabase stack |
| `pnpm supabase:link` / `pull` / `push` / `reset` | Sync schema between local and remote |
| `pnpm supabase:generate-types` / `generate-migration` / `generate-seed` | Codegen and migration helpers |

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
