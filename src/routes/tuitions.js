import { Router } from "express";
import { col, oid } from "../db.js";
import { optionalAuth, verifyToken, verifyTutor } from "../middleware/auth.js";
import { cleanTuition } from "../validators.js";
import { FREE_TUITION_LIMIT } from "../constants.js";
import { h, escapeRegex, toInt } from "../utils.js";

const router = Router();

// Only these tuitions are visible on the public pages
const PUBLIC = { approvalStatus: "approved", isActive: true };

// GET /tuitions  (server-side search, filter, sort and pagination)
router.get("/", h(async (req, res) => {
  const page = Math.max(1, toInt(req.query.page, 1));
  const limit = Math.min(24, Math.max(1, toInt(req.query.limit, 9)));

  const filter = { ...PUBLIC };
  const search = String(req.query.search || "").trim();
  const subject = String(req.query.subject || "").trim();
  const classLevel = String(req.query.classLevel || "").trim();
  const mode = String(req.query.mode || "").trim();

  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: rx }, { subject: rx }];
  }
  if (subject) filter.subject = new RegExp(`^${escapeRegex(subject)}$`, "i");
  if (classLevel) filter.classLevel = classLevel;
  if (mode === "Online" || mode === "Offline") filter.mode = mode;

  const sorts = {
    latest: { createdAt: -1 },
    fee_low: { monthlyFee: 1 },
    fee_high: { monthlyFee: -1 },
  };
  const sort = sorts[String(req.query.sort)] || sorts.latest;

  const total = await col.tuitions().countDocuments(filter);
  const items = await col
    .tuitions()
    .find(filter)
    .sort({ ...sort, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)), limit });
}));

// GET /tuitions/meta/filters  (options for the filter dropdowns)
router.get("/meta/filters", h(async (_req, res) => {
  const [subjects, classLevels] = await Promise.all([
    col.tuitions().distinct("subject", PUBLIC),
    col.tuitions().distinct("classLevel", PUBLIC),
  ]);
  res.json({ subjects: subjects.sort(), classLevels });
}));

// GET /tuitions/:id
router.get("/:id", optionalAuth, h(async (req, res) => {
  const _id = oid(req.params.id);
  if (!_id) return res.status(400).json({ message: "Invalid tuition id." });

  const tuition = await col.tuitions().findOne({ _id });
  if (!tuition) return res.status(404).json({ message: "Tuition not found." });

  const visible = tuition.approvalStatus === "approved" && tuition.isActive;
  const canSee =
    req.user && (req.user.role === "admin" || req.user.email === tuition.tutorEmail);

  if (!visible && !canSee) {
    return res.status(404).json({ message: "This tuition is not available." });
  }

  const [tutor, tuitionCount] = await Promise.all([
    col.users().findOne(
      { email: tuition.tutorEmail },
      { projection: { name: 1, image: 1, bio: 1, plan: 1, createdAt: 1 } }
    ),
    col.tuitions().countDocuments({ tutorEmail: tuition.tutorEmail, ...PUBLIC }),
  ]);

  res.json({
    ...tuition,
    tutor: {
      name: tutor?.name || tuition.tutorName,
      image: tutor?.image || null,
      bio: tutor?.bio || "",
      isPro: tutor?.plan === "pro",
      joinedAt: tutor?.createdAt || null,
      tuitionCount,
    },
  });
}));

// POST /tuitions  (tutor only; free plan = 2 posts)
router.post("/", verifyToken, verifyTutor, h(async (req, res) => {
  const { data, error } = cleanTuition(req.body);
  if (error) return res.status(400).json({ message: error });

  if (req.user.plan !== "pro") {
    const count = await col.tuitions().countDocuments({ tutorEmail: req.user.email });
    if (count >= FREE_TUITION_LIMIT) {
      return res.status(403).json({
        code: "FREE_LIMIT",
        message: `Free plan tutors can post up to ${FREE_TUITION_LIMIT} tuitions. Upgrade to Pro for unlimited posts.`,
      });
    }
  }

  const doc = {
    ...data,
    tutorName: req.user.name,
    tutorEmail: req.user.email,
    approvalStatus: "pending",
    isActive: true,
    createdAt: new Date(),
  };

  const result = await col.tuitions().insertOne(doc);
  res.status(201).json({ _id: result.insertedId, ...doc });
}));

// Loads a tuition that belongs to the logged in tutor (or sends the error)
async function ownedTuition(req, res) {
  const _id = oid(req.params.id);
  if (!_id) {
    res.status(400).json({ message: "Invalid tuition id." });
    return null;
  }
  const tuition = await col.tuitions().findOne({ _id });
  if (!tuition) {
    res.status(404).json({ message: "Tuition not found." });
    return null;
  }
  if (tuition.tutorEmail !== req.user.email) {
    res.status(403).json({ message: "You can only manage your own tuitions." });
    return null;
  }
  return tuition;
}

// PATCH /tuitions/:id  (edit details)
router.patch("/:id", verifyToken, verifyTutor, h(async (req, res) => {
  const tuition = await ownedTuition(req, res);
  if (!tuition) return;

  const { data, error } = cleanTuition(req.body);
  if (error) return res.status(400).json({ message: error });

  const update = { ...data, updatedAt: new Date() };
  // A rejected post goes back to review after the tutor fixes it
  if (tuition.approvalStatus === "rejected") update.approvalStatus = "pending";

  await col.tuitions().updateOne({ _id: tuition._id }, { $set: update });
  res.json({ ...tuition, ...update });
}));

// PATCH /tuitions/:id/active  (toggle Active / Closed)
router.patch("/:id/active", verifyToken, verifyTutor, h(async (req, res) => {
  const tuition = await ownedTuition(req, res);
  if (!tuition) return;

  const isActive = Boolean(req.body?.isActive);
  await col.tuitions().updateOne(
    { _id: tuition._id },
    { $set: { isActive, updatedAt: new Date() } }
  );
  res.json({ ...tuition, isActive });
}));

// DELETE /tuitions/:id
router.delete("/:id", verifyToken, verifyTutor, h(async (req, res) => {
  const tuition = await ownedTuition(req, res);
  if (!tuition) return;

  await col.tuitions().deleteOne({ _id: tuition._id });
  await col.applications().deleteMany({ tuitionId: tuition._id });
  res.json({ deleted: true });
}));

export default router;
