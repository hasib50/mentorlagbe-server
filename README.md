# MentorLagbe - REST API (Server)

Express + MongoDB API for the MentorLagbe platform. It verifies the JWT created by the
Next.js client, enforces role based access and handles Stripe payments.

- **Live API:** https://your-server.onrender.com  <!-- TODO -->
- **Client repository:** https://github.com/your-username/mentorlagbe-client  <!-- TODO -->

## Collections (4)

| Collection | Purpose |
|---|---|
| `users` | Created by BetterAuth. Holds role, plan, profile and saved tuitions |
| `tuitions` | Tuition posts, approval status and active flag |
| `applications` | Student applications (unique per student + tuition) |
| `payments` | Stripe Pro plan transactions |

BetterAuth also keeps its own `sessions`, `accounts` and `verifications` collections.

## Middlewares

`verifyToken`, `verifyStudent`, `verifyTutor`, `verifyAdmin` in `src/middleware/auth.js`.
The user's role and plan are always read from the database, never trusted from the token.

## API routes

| Method | Route | Access |
|---|---|---|
| GET | `/public/stats` | Public |
| GET | `/tuitions?search&subject&classLevel&mode&sort&page&limit` | Public (approved + active only) |
| GET | `/tuitions/meta/filters` | Public |
| GET | `/tuitions/:id` | Public (owner/admin can also see non-public posts) |
| POST | `/tuitions` | Tutor (free plan limit: 2 posts) |
| PATCH | `/tuitions/:id`, `/tuitions/:id/active` | Tutor (owner) |
| DELETE | `/tuitions/:id` | Tutor (owner) |
| GET | `/tutor/tuitions`, `/tutor/applications`, `/tutor/stats` | Tutor |
| POST | `/applications` | Student |
| GET | `/applications/check/:tuitionId` | Logged in |
| DELETE | `/applications/:id` | Student (own, pending only) |
| PATCH | `/applications/:id/status` | Tutor (own tuitions) |
| GET | `/student/applications`, `/student/stats` | Student |
| GET / PATCH | `/users/me` | Logged in |
| GET / POST | `/users/me/saved`, `/users/me/saved/:tuitionId` | Student |
| GET | `/admin/stats`, `/admin/users`, `/admin/tuitions`, `/admin/payments` | Admin |
| PATCH | `/admin/users/:id/role`, `/admin/tuitions/:id/status` | Admin |
| POST | `/payments/checkout`, `/payments/verify` | Logged in |
| POST | `/payments/webhook` | Stripe |

## npm packages used

`express`, `cors`, `dotenv`, `mongodb`, `jsonwebtoken`, `stripe`, `nodemon` (dev).

## Run locally

```bash
npm install
cp .env.example .env     # then fill in the values
npm run dev              # http://localhost:5000
npm run seed             # demo tuitions, applications and payments
```

## Environment variables (`.env`)

`PORT`, `CLIENT_URL`, `MONGODB_URI`, `MONGODB_DB_NAME`, `JWT_SECRET` (same as the client),
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (optional).

## Stripe

Checkout is created on the server (`POST /payments/checkout`). After payment the success page calls
`POST /payments/verify`, and the optional webhook (`/payments/webhook`) does the same job. Both use one
idempotent function, so a payment is never saved twice.
