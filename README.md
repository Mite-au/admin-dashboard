# Mite Admin Dashboard

Admin dashboard for the [Mite marketplace](../miteApp) backend. Built with
**Next.js 15 (App Router)**, **React 19**, and **Tailwind CSS**, deployed on
**Vercel** (free tier, automatic deploy on push to `main`).

## Features

- **Overview** – totals (users / posts / sales / revenue / open reports) and
  a post-activity chart (Recharts).
- **Users** – paginated user table with status filter pills and search.
  User detail page with moderation actions (suspend / ban) and the user's
  recent listings.
- **Listings** – paginated listings table with filter pills (published / sold
  / paused / archived / reported). Listing detail page with photo gallery
  and moderation actions (archive / remove).
- **Transactions** – paginated transactions table with status filters.
- **Threads** – community thread moderation (active / flagged / archived).
- **Reports / Settings** – placeholders wired up for future endpoints.
- **Login / logout** – posts to `/auth/admin/login` on the NestJS backend and
  stores a JWT in an `httpOnly` cookie.

## Local development

```bash
npm install
cp .env.example .env.local
# edit .env.local and point NEXT_PUBLIC_API_BASE_URL at your backend
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) (the backend uses 3000, so
run `next dev -p 3001` if both are local — or change the backend port).

## Backend contract

All data-fetching lives in [`src/lib/fetchers.ts`](src/lib/fetchers.ts) and
hits the following endpoints (to be added on the NestJS side):

| Endpoint                         | Purpose                         |
| -------------------------------- | ------------------------------- |
| `GET /admin/overview`            | Dashboard totals + activity     |
| `GET /admin/users`               | Paginated user list             |
| `GET /admin/users/:id`           | Single user                     |
| `GET /admin/users/:id/posts`     | Listings by a user              |
| `GET /admin/posts`               | Paginated listings              |
| `GET /admin/posts/:id`           | Single listing                  |
| `GET /admin/transactions`        | Paginated transactions          |
| `GET /admin/threads`             | Paginated threads               |
| `POST /auth/admin/login`         | Exchange email/password for JWT |

Until those endpoints exist, each fetcher falls back to deterministic mock
data in [`src/lib/mock.ts`](src/lib/mock.ts) so the UI stays renderable.

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import it into Vercel; the `vercel.json` sets `framework: nextjs`.
3. Set environment variables in the Vercel project:
   - `NEXT_PUBLIC_API_BASE_URL` – the production backend URL
   - `ADMIN_API_TOKEN` – server-side token used for RSC fetches
4. Every push to `main` auto-deploys.
