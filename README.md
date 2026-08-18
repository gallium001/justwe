# JustWe

A private, community-based dating platform built around trusted hosts. Members discover **communities** before they ever see individual dating profiles; a host approves membership; only then can a member browse eligible profiles inside that community. Mutual interest stays completely anonymous until the community host reviews and approves the connection.

This is a real, deployable Next.js application backed by PostgreSQL — not a prototype.

---

## 1. How the product works

```
Create account -> Discover communities -> Request to join -> Host approves
-> Browse eligible profiles in that community (worldwide, no distance filter)
-> Like someone -> If they liked you back -> BOTH notified anonymously
-> Host reviews both full profiles -> Host approves or rejects
-> Only on approval: identities reveal, profiles unlock, messaging unlocks
```

Core principles (see `src/lib/authorization.ts` for enforcement):

- **Community before discovery.** No global swiping feed. Ever.
- **Worldwide by design.** Discovery has *zero* distance/country filtering. Community membership is the only access boundary. A Finland-based member and a Kenya-based member in the same worldwide community can freely discover each other.
- **Mutual interest is private until approved.** Neither party can determine the other's identity, not through the UI, not through the API, not through notification payloads, until the host approves the match. This is enforced server-side in `serializeMatchForParticipant()`.
- **Photo galleries are view-only.** No likes/comments/reactions. Owners see an aggregate view count only; no one, including the owner, can see who viewed a photo.
- **Hosts are scoped to their own communities.** A host can never read another host's match reviews or members.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth (credentials provider, JWT sessions) |
| Object storage | Any S3-compatible provider (Cloudflare R2 recommended) |
| Email | Resend |
| Tests | Vitest |

---

## 3. Local setup

### Prerequisites
- Node.js 18.18+
- A PostgreSQL database (local via Docker, or a free managed instance, see section 5)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env and fill in DATABASE_URL/DIRECT_URL at minimum to get started locally.
# Storage/email vars can be left as placeholders for local dev; uploads will
# fail gracefully and emails will log to the console instead of sending.

# 3. Run database migrations
npx prisma migrate dev --name init

# 4. Seed development data (creates hosts, communities, members across
#    multiple countries, a Finland<->Kenya long-distance example, likes,
#    matches in every state, messages, and posts)
npm run db:seed

# 5. Start the dev server
npm run dev
```

Visit `http://localhost:3000`.

### Seeded accounts (password for all: `Password123`)
| Role | Email |
|---|---|
| Admin | `admin@justwe.dev` |
| Verified host | `sarah.host@justwe.dev` |
| Unverified host | `daniel.host@justwe.dev` |
| Members | `aino.member@justwe.dev`, `grace.member@justwe.dev`, `john.member@justwe.dev`, `emma.member@justwe.dev`, `michael.member@justwe.dev`, `abena.member@justwe.dev`, `peter.member@justwe.dev`, `olivia.member@justwe.dev` |

Notable seeded state: Aino (Finland) and Grace (Kenya) have a **pending mutual match**, log in as either to see the anonymous notification, then log in as Sarah (the community host) to review and approve/reject it. John and Abena have an **approved match with an existing conversation**.

---

## 4. Database & migrations

Schema lives in `prisma/schema.prisma`. To change it:

```bash
# after editing schema.prisma
npx prisma migrate dev --name describe_your_change
```

To apply migrations in production (no interactive prompts):

```bash
npm run db:deploy   # runs `prisma migrate deploy`
```

Prisma Studio (visual DB browser) for local debugging:

```bash
npm run db:studio
```

---

## 5. Deployment: get a real public URL

### 5.1 Database: Neon or Supabase (free tier works)

1. Create a project at neon.tech or supabase.com.
2. Copy the pooled connection string into `DATABASE_URL` and the direct connection string into `DIRECT_URL` (Neon/Supabase both expose both).

### 5.2 Object storage: Cloudflare R2 (recommended, no egress fees)

1. Create an R2 bucket in the Cloudflare dashboard.
2. Create an API token with R2 read/write access, giving you `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`.
3. Set `S3_ENDPOINT` to `https://<account-id>.r2.cloudflarestorage.com`.
4. Enable public access on the bucket (or put a Cloudflare custom domain in front of it) and set `PUBLIC_MEDIA_URL` / `PUBLIC_MEDIA_HOSTNAME` accordingly.

(AWS S3, Backblaze B2, and DigitalOcean Spaces all work identically, just change the endpoint/credentials.)

### 5.3 Email: Resend

1. Sign up at resend.com, verify a sending domain (or use their test domain while developing).
2. Create an API key -> `RESEND_API_KEY`.

### 5.4 Application: Vercel

1. Push this repository to GitHub.
2. Import it into Vercel (vercel.com/new).
3. Add every variable from `.env.example` in Project Settings -> Environment Variables (use your real values from 5.1-5.3). Set `NEXTAUTH_URL` to your Vercel URL (e.g. `https://justwe.vercel.app`) and generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.
4. Deploy.
5. Run migrations against the production database once:
   ```bash
   DATABASE_URL="<your prod url>" DIRECT_URL="<your prod direct url>" npm run db:deploy
   ```
6. (Optional but recommended) seed an initial verified host so the platform has something to show real users on day one:
   ```bash
   DATABASE_URL="<your prod url>" npm run db:seed
   ```
   or create your own account through the UI and promote it manually (section 6).

You now have a public URL you can share. Anyone who visits it can register, verify their email, join/host communities, and use the full platform.

---

## 6. Creating your first admin / verified host in production

The seed script is convenient for demos, but for a real launch you'll likely want to promote a real account instead:

```sql
-- Connect to your production DB (e.g. via `psql` or your provider's SQL console)
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Once you're an admin, use `/admin` in the app to verify hosts (mark `HostVerification.status = VERIFIED`), no direct SQL needed after that.

---

## 7. Testing

```bash
npm test
```

Point `DATABASE_URL` at a **disposable** test database before running tests, `tests/setup.ts` truncates all tables before the suite runs. Never run tests against production data.

Covered scenarios (`tests/lib/*.test.ts`):
- Non-members cannot access community dating profiles.
- Approved members from different countries/continents *can* discover each other (Finland/Kenya case), confirming there is no hidden distance filter.
- Pending (not-yet-approved) members cannot access profiles.
- Removed members immediately lose access.
- Users with an inactive dating profile are not exposed.
- Mutual likes create a pending match whose serialized form never contains the counterparty's identity, checked for both participants, and after rejection.
- Only the correct community host (or an admin) can resolve full identities of a pending match; an unrelated host is rejected.
- Blocking is bidirectional and immediately cuts off profile access.
- Photo views are recorded, aggregate-counted, debounced against rapid repeats, and never expose the viewer's identity through any query shape.
- Messaging is blocked until a match is APPROVED, and blocked for non-participants.

---

## 8. Project structure

```
src/
  app/                     Pages (App Router) + API routes (app/api/**)
  components/              UI components (layout, profile, discover, providers)
  lib/
    authorization.ts       Central privacy/authorization engine, read this first
    auth.ts                NextAuth config
    session.ts             requireUser/requireAdmin helpers for API routes
    validators.ts          Zod schemas for every input
    email.ts               Transactional email (anonymous copy enforced here)
    notifications.ts       Notification copy, anonymous copy enforced here
    storage.ts             S3-compatible presigned uploads
    location.ts            Privacy-level-aware location formatting
prisma/
  schema.prisma            Full data model
  seed.ts                  Development seed data
tests/
  lib/*.test.ts            Privacy/authorization test suites
```

---

## 9. Privacy & security model (what's enforced where)

| Rule | Enforced in |
|---|---|
| No profile access without shared approved community membership | `requireProfileAccess()` / `getAuthorizedSharedCommunity()` |
| No distance/country filtering in Discover | `GET /api/communities/[communityId]/discover` deliberately has no such filter, see the comment in that file |
| Counterparty identity hidden until match approval | `serializeMatchForParticipant()`, `GET /api/my/pending-connections`, notification copy in `src/lib/notifications.ts` |
| Only the assigned community's host (or admin) can resolve a pending match's identities | `requireHostMatchAccess()` |
| Removed/rejected members instantly lose access | Membership status is checked live on every request (never cached) |
| Photo galleries view-only, aggregate counts only | No like/comment schema exists for `DatingPhoto`; `viewCount` is the only exposed metric, and only to the owner |
| View debouncing to prevent inflation | `PHOTO_VIEW_DEBOUNCE_MS` window in `src/app/api/profiles/[userId]/photos/route.ts` |
| Blocking cuts off discovery, liking, messaging, and profile/gallery access | `isBlockedEitherWay()` used in every relevant route |
| Messaging gated to approved matches | `assertApprovedParticipant()` in the messages routes |
| Reporter identity never shown to reported user | Reports are admin-only (`/api/admin/reports`) |
| Age 18+ enforced server-side, not just client-side | Checked in `/api/auth/register` and `/api/me/dating-activate` |
| Passwords hashed (bcrypt, cost 12), reset/verification tokens hashed at rest and single-use | `src/app/api/auth/*` |
| Rate limiting on auth-sensitive endpoints | `src/lib/rate-limit.ts` |

---

## 10. Troubleshooting

**"Environment variable not found: DATABASE_URL"** - you haven't created `.env` from `.env.example`, or forgot to set it in your hosting provider.

**Prisma Client errors after editing schema.prisma** - run `npx prisma generate` (this also runs automatically via `postinstall`).

**Uploads fail locally** - you need real S3-compatible credentials; without them `createPresignedUpload` will throw. For local development without cloud storage configured, you can temporarily point `PUBLIC_MEDIA_URL`/`S3_*` at a local MinIO container.

**Emails aren't arriving locally** - without `RESEND_API_KEY` set, `src/lib/email.ts` logs email content to the console instead of sending, so the app keeps working end-to-end without a real provider configured.

**"Too many requests" during testing** - the in-memory rate limiter (`src/lib/rate-limit.ts`) is per-process; restart the dev server to reset it. For a multi-instance production deployment, swap it for `@upstash/ratelimit` (interface is designed as a drop-in replacement).

---

## 11. Roadmap (deliberately not built in v1, per product scope)

AI matchmaking, payments/subscriptions, voice/video calls, livestreaming, native mobile apps, and advanced analytics were intentionally excluded to keep the initial platform focused and shippable. The architecture doesn't preclude adding them later.
