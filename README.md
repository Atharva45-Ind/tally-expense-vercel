# Tally – MERN expense tracker

Express + MongoDB (Mongoose) API, React (Vite) client.

## Run it

You need Node 18+ and a MongoDB (local `mongod` or an Atlas connection string).

```bash
# terminal 1 – API
cd server
cp .env.example .env        # then edit JWT_SECRET (and MONGO_URI if not local)
npm install
npm run seed                # optional: demo@example.com / password123 with 6 months of data
npm run dev                 # http://localhost:5000

# terminal 2 – client
cd client
npm install
npm run dev                 # http://localhost:5173
```

In dev, Vite proxies `/api` to port 5000, so no CORS setup is needed.

## API

All routes are under `/api`. Everything except `/auth/register`, `/auth/login` and `/health` needs `Authorization: Bearer <token>`.

| Method | Route | Notes |
| --- | --- | --- |
| POST | `/auth/register`, `/auth/login` | returns `{ token, user }`; register seeds default categories |
| GET | `/auth/me` | current user |
| GET/POST | `/categories` | |
| PUT/DELETE | `/categories/:id` | delete is refused while expenses use it |
| GET | `/expenses?from=&to=&category=&q=&page=&limit=` | dates are `YYYY-MM-DD`; returns items, paging, `totalAmount` |
| POST | `/expenses` | `{ amount, category, date, note?, paymentMethod? }` |
| PUT/DELETE | `/expenses/:id` | |
| GET | `/budgets?month=YYYY-MM` | each item includes `spent` and `percentUsed` |
| PUT | `/budgets` | `{ category, month, limit }` creates or replaces |
| DELETE | `/budgets/:id` | |
| GET | `/analytics/summary?month=` | total, count, vs previous month, daily average, top category |
| GET | `/analytics/by-category?from=&to=` | totals and share per category |
| GET | `/analytics/trend?months=6&to=` | monthly totals, empty months filled with 0 |

## Design notes

- **Money** is stored as integer minor units (`amountMinor`, paise/cents) and exposed as decimals (`amount`), so sums never drift.
- **Dates** are calendar dates stored at UTC midnight, so month totals are identical regardless of server or browser timezone.
- **Analytics** use MongoDB aggregation pipelines (`services/analyticsService.js`). Aggregations don't auto-cast ids, which is why `oid()` is used there.
- Indexes: `{ user, date }` and `{ user, category, date }` on expenses; unique `{ user, name }` (case-insensitive) on categories; unique `{ user, category, month }` on budgets.

## Deploying to Vercel

One Vercel project serves both parts: `client/` is built as static files, and `api/index.js` runs the Express app as a serverless function (`/api/*`).

1. Create a free MongoDB Atlas cluster. Under **Network Access** allow `0.0.0.0/0` (Vercel's IPs change), and copy the connection string.
2. Push this folder to GitHub, then **Add New → Project** in Vercel and import the repo. Leave the framework preset as "Other"; `vercel.json` sets the build.
3. Add environment variables (Settings → Environment Variables):
   - `MONGO_URI` – your Atlas string, with a database name, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/expense_tracker`
   - `JWT_SECRET` – a long random string (`openssl rand -hex 32`)
4. Deploy. Check `https://<your-app>.vercel.app/api/health` returns `{"ok":true}`.

`VITE_API_URL` and `CLIENT_ORIGIN` are not needed: the client and API share one domain.
To load demo data into Atlas, run `npm run seed` in `server/` locally with `MONGO_URI` pointed at Atlas.
