import { Router } from "express";
import { col, oid } from "../db.js";
import { verifyAdmin, verifyStudent, verifyToken, verifyTutor } from "../middleware/auth.js";
import { h } from "../utils.js";

export const tutorRouter = Router();
export const studentRouter = Router();

// ---------- TUTOR ----------
tutorRouter.use(verifyToken, verifyTutor);

tutorRouter.get("/tuitions", h(async (req, res) => {
  const items = await col
    .tuitions()
    .find({ tutorEmail: req.user.email })
    .sort({ createdAt: -1 })
    .toArray();
  res.json(items);
}));

tutorRouter.get("/applications", h(async (req, res) => {
  const items = await col
    .applications()
    .find({ tutorEmail: req.user.email })
    .sort({ appliedAt: -1 })
    .toArray();

  // Pro students get a badge (and appear first) = priority booking
  const emails = [...new Set(items.map((item) => item.studentEmail))];
  const students = await col
    .users()
    .find({ email: { $in: emails } }, { projection: { email: 1, plan: 1 } })
    .toArray();
  const planByEmail = new Map(students.map((student) => [student.email, student.plan || "free"]));

  res.json(items.map((item) => ({ ...item, studentPlan: planByEmail.get(item.studentEmail) || "free" })));
}));

tutorRouter.get("/stats", h(async (req, res) => {
  const email = req.user.email;
  const [totalTuitions, approved, pending, totalApplicants, pendingApplicants] =
    await Promise.all([
      col.tuitions().countDocuments({ tutorEmail: email }),
      col.tuitions().countDocuments({ tutorEmail: email, approvalStatus: "approved", isActive: true }),
      col.tuitions().countDocuments({ tutorEmail: email, approvalStatus: "pending" }),
      col.applications().countDocuments({ tutorEmail: email }),
      col.applications().countDocuments({ tutorEmail: email, status: "pending" }),
    ]);

  res.json({
    totalTuitions,
    approved,
    pending,
    totalApplicants,
    pendingApplicants,
    plan: req.user.plan,
  });
}));

// ---------- STUDENT ----------
studentRouter.use(verifyToken, verifyStudent);

studentRouter.get("/applications", h(async (req, res) => {
  const items = await col
    .applications()
    .find({ studentEmail: req.user.email })
    .sort({ appliedAt: -1 })
    .toArray();
  res.json(items);
}));

studentRouter.get("/stats", h(async (req, res) => {
  const email = req.user.email;
  const [total, accepted, pending, rejected] = await Promise.all([
    col.applications().countDocuments({ studentEmail: email }),
    col.applications().countDocuments({ studentEmail: email, status: "accepted" }),
    col.applications().countDocuments({ studentEmail: email, status: "pending" }),
    col.applications().countDocuments({ studentEmail: email, status: "rejected" }),
  ]);
  res.json({ total, accepted, pending, rejected, plan: req.user.plan });
}));

// ---------- ADMIN ----------
export const adminRouter = Router();
adminRouter.use(verifyToken, verifyAdmin);

adminRouter.get("/stats", h(async (_req, res) => {
  const [
    totalUsers, totalTutors, totalStudents, proUsers,
    pendingTuitions, approvedTuitions, rejectedTuitions,
    revenueAgg, monthly, recentPayments,
  ] = await Promise.all([
    col.users().countDocuments({}),
    col.users().countDocuments({ role: "tutor" }),
    col.users().countDocuments({ role: "student" }),
    col.users().countDocuments({ plan: "pro" }),
    col.tuitions().countDocuments({ approvalStatus: "pending" }),
    col.tuitions().countDocuments({ approvalStatus: "approved" }),
    col.tuitions().countDocuments({ approvalStatus: "rejected" }),
    col.payments().aggregate([
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]).toArray(),
    col.payments().aggregate([
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$paidAt" } }, total: { $sum: "$amount" } } },
      { $sort: { _id: -1 } },
      { $limit: 6 },
    ]).toArray(),
    col.payments().find({}).sort({ paidAt: -1 }).limit(5).toArray(),
  ]);

  res.json({
    totalUsers, totalTutors, totalStudents, proUsers,
    pendingTuitions, approvedTuitions, rejectedTuitions,
    revenue: revenueAgg[0]?.total || 0,
    paymentCount: revenueAgg[0]?.count || 0,
    revenueByMonth: monthly.reverse().map((m) => ({ month: m._id, total: m.total })),
    recentPayments,
  });
}));

adminRouter.get("/users", h(async (req, res) => {
  const filter = {};
  const role = String(req.query.role || "");
  const search = String(req.query.search || "").trim();

  if (["student", "tutor", "admin"].includes(role)) filter.role = role;
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const users = await col
    .users()
    .find(filter, { projection: { savedTuitions: 0 } })
    .sort({ createdAt: -1 })
    .limit(300)
    .toArray();
  res.json(users);
}));

adminRouter.patch("/users/:id/role", h(async (req, res) => {
  const _id = oid(req.params.id);
  const role = String(req.body?.role || "");

  if (!_id) return res.status(400).json({ message: "Invalid user id." });
  if (!["student", "tutor", "admin"].includes(role)) {
    return res.status(400).json({ message: "Role must be student, tutor or admin." });
  }

  const target = await col.users().findOne({ _id });
  if (!target) return res.status(404).json({ message: "User not found." });
  if (target.email === req.user.email) {
    return res.status(400).json({ message: "You cannot change your own role." });
  }

  await col.users().updateOne({ _id }, { $set: { role, updatedAt: new Date() } });
  res.json({ _id, role });
}));

adminRouter.get("/tuitions", h(async (req, res) => {
  const filter = {};
  const status = String(req.query.status || "");
  if (["pending", "approved", "rejected"].includes(status)) filter.approvalStatus = status;

  const items = await col.tuitions().find(filter).sort({ createdAt: -1 }).toArray();
  res.json(items);
}));

adminRouter.patch("/tuitions/:id/status", h(async (req, res) => {
  const _id = oid(req.params.id);
  const approvalStatus = String(req.body?.approvalStatus || "");

  if (!_id) return res.status(400).json({ message: "Invalid tuition id." });
  if (!["approved", "rejected", "pending"].includes(approvalStatus)) {
    return res.status(400).json({ message: "Invalid approval status." });
  }

  const result = await col.tuitions().updateOne(
    { _id },
    { $set: { approvalStatus, reviewedAt: new Date() } }
  );
  if (result.matchedCount === 0) return res.status(404).json({ message: "Tuition not found." });
  res.json({ _id, approvalStatus });
}));

adminRouter.get("/payments", h(async (_req, res) => {
  const items = await col.payments().find({}).sort({ paidAt: -1 }).toArray();
  res.json(items);
}));
