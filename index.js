import "dotenv/config";
import "./src/dns-fix.js";   // <-- eita notun
import express from "express";
import "dotenv/config";
import cors from "cors";
import { connectDB } from "./src/db.js";
import tuitionsRouter from "./src/routes/tuitions.js";
import applicationsRouter from "./src/routes/applications.js";
import usersRouter from "./src/routes/users.js";
import publicRouter from "./src/routes/public.js";
import paymentsRouter, { stripeWebhook } from "./src/routes/payments.js";
import { tutorRouter, studentRouter, adminRouter } from "./src/routes/dashboard.js";



const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin(origin, callback) {
      // Allow tools without an Origin header and the configured client(s)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked for origin ${origin}`));
    },
  })
);

// Stripe needs the raw body to verify the signature, so this route
// must be registered BEFORE express.json()
app.post("/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);

app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => res.json({ service: "MentorLagbe API", status: "ok" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/public", publicRouter);
app.use("/tuitions", tuitionsRouter);
app.use("/applications", applicationsRouter);
app.use("/users", usersRouter);
app.use("/tutor", tutorRouter);
app.use("/student", studentRouter);
app.use("/admin", adminRouter);
app.use("/payments", paymentsRouter);

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || (err.type === "StripeInvalidRequestError" ? 400 : 500);
  res.status(status).json({ message: err.message || "Something went wrong on the server." });
});

connectDB()
  .then(() => app.listen(PORT, () => console.log(`MentorLagbe API running on http://localhost:${PORT}`)))
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
