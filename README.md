# MentorLagbe - REST API (Server)

Express and MongoDB API for the MentorLagbe tuition platform. It verifies the JWT sent by the Next.js client,
enforces role-based access (student, tutor, admin) and handles Stripe payments.

**Purpose:** powers tuition listings, applications, dashboards, admin moderation and Pro plan payments.

## Live links

| | Link |
|---|---|
| Live API | https://mentorlagbe-server-beta.vercel.app |
| Live site | https://mentorlagbe-client-azure.vercel.app |
| Client repository | https://github.com/hasib50/mentorlagbe-client |

## Admin and demo credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@mentorlagbe.com | Admin@123 |
| **Tutor** | tutor@mentorlagbe.com | Tutor@123 |
| **Student** | student@mentorlagbe.com | Student@123 |

## Key features

- **JWT verification and role middlewares:** `verifyToken`, `verifyStudent`, `verifyTutor`, `verifyAdmin`. The role and plan are always read from the database, never trusted from the token.
- **Server-side search, filter, sort and pagination** for tuitions using MongoDB `skip` and `limit`.
- **Duplicate application protection** with a unique database index.
- **Free plan limit:** free tutors can post 2 tuitions, Pro tutors unlimited.
- **Stripe Checkout, verification and webhook.** Payments are saved once only (idempotent) and the user is upgraded to Pro.
- **Admin routes** for tuition approval, user roles, statistics and transactions.
- **Seed script** with realistic tutors, tuitions, applications and payments.

## Database collections

| Collection | Purpose |
|---|---|
| `users` | Created by BetterAuth. Holds role, plan, profile and saved tuitions |
| `tuitions` | Tuition posts with approval status and active flag |
| `applications` | Student applications (unique per student and tuition) |
| `payments` | Stripe Pro plan transactions |

## API routes

| Method | Route | Access |
|---|---|---|
| GET | `/public/stats` | Public |
| GET | `/tuitions?search&subject&classLevel&mode&sort&page&limit` | Public (approved and active only) |
| GET | `/tuitions/meta/filters` | Public |
| GET | `/tuitions/:id` | Public (owner and admin can also see non-public posts) |
| POST | `/tuitions` | Tutor |
| PATCH | `/tuitions/:id`, `/tuitions/:id/active` | Tutor (owner) |
| DELETE | `/tuitions/:id` | Tutor (owner) |
| GET | `/tutor/tuitions`, `/tutor/applications`, `/tutor/stats` | Tutor |
| POST | `/applications` | Student |
| GET | `/applications/check/:tuitionId` | Logged in |
| DELETE | `/applications/:id` | Student (own, pending only) |
| PATCH | `/applications/:id/status` | Tutor (own tuitions) |
| GET | `/student/applications`, `/student/stats` | Student |
| GET, PATCH | `/users/me` | Logged in |
| GET, POST | `/users/me/saved`, `/users/me/saved/:tuitionId` | Student |
| GET | `/admin/stats`, `/admin/users`, `/admin/tuitions`, `/admin/payments` | Admin |
| PATCH | `/admin/users/:id/role`, `/admin/tuitions/:id/status` | Admin |
| POST | `/payments/checkout`, `/payments/verify` | Logged in |
| POST | `/payments/webhook` | Stripe |

## npm packages used

| Package | Purpose |
|---|---|
| `express` | Web server |
| `cors` | Allows the client origin |
| `dotenv` | Loads environment variables |
| `mongodb` | Database driver |
| `jsonwebtoken` | Verifies the JWT |
| `stripe` | Stripe Checkout and webhooks |
| `nodemon` (dev) | Auto restart in development |

## Run locally

```bash
git clone https://github.com/hasib50/mentorlagbe-server.git
cd mentorlagbe-server
npm install
cp .env.example .env     # fill in the values below
npm run dev              # http://localhost:5000
npm run seed             # demo tuitions, applications and payments
```

## Environment variables (`.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default 5000) |
| `CLIENT_URL` | URL of the client, used for CORS and Stripe redirects |
| `MONGODB_URI`, `MONGODB_DB_NAME` | MongoDB connection |
| `JWT_SECRET` | Must be identical to the client's `JWT_SECRET` |
| `STRIPE_SECRET_KEY` | Stripe secret key (test mode) |
| `STRIPE_WEBHOOK_SECRET` | Optional, only for the webhook |

## Stripe payments

Checkout is created on the server (`POST /payments/checkout`). After payment the success page calls
`POST /payments/verify`. The optional webhook (`/payments/webhook`) uses the same idempotent function,
so a payment is never saved twice.