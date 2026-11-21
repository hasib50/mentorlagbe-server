import { Router } from "express";
import { col, oid } from "../db.js";
import { verifyStudent, verifyToken, verifyTutor } from "../middleware/auth.js";
import { cleanApplication } from "../validators.js";
import { h } from "../utils.js";

const router = Router();

// POST /applications  (student applies)
router.post("/", verifyToken, verifyStudent, h(async (req, res) => {
  const tuitionId = oid(String(req.body?.tuitionId || ""));
  if (!tuitionId) return res.status(400).json({ message: "Invalid tuition id." });

  const { data, error } = cleanApplication(req.body);
  if (error) return res.status(400).json({ message: error });

  const tuition = await col.tuitions().findOne({
    _id: tuitionId,
    approvalStatus: "approved",
    isActive: true,
  });
  if (!tuition) {
    return res.status(404).json({ message: "This tuition is not accepting applications." });
  }

  const existing = await col.applications().findOne({
    tuitionId,
    studentEmail: req.user.email,
  });
  if (existing) {
    return res.status(409).json({ message: "You have already applied for this tuition." });
  }

  const doc = {
    tuitionId,
    tuitionTitle: tuition.title,
    subject: tuition.subject,
    monthlyFee: tuition.monthlyFee,
    tutorEmail: tuition.tutorEmail,
    tutorName: tuition.tutorName,
    studentName: req.user.name,
    studentEmail: req.user.email,
    ...data,
    status: "pending",
    appliedAt: new Date(),
  };

  try {
    const result = await col.applications().insertOne(doc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  } catch (err) {
    // Unique index: two quick clicks cannot create two applications
    if (err.code === 11000) {
      return res.status(409).json({ message: "You have already applied for this tuition." });
    }
    throw err;
  }
}));

// GET /applications/check/:tuitionId  (has this student applied already?)
router.get("/check/:tuitionId", verifyToken, h(async (req, res) => {
  const tuitionId = oid(req.params.tuitionId);
  if (!tuitionId) return res.status(400).json({ message: "Invalid tuition id." });

  const application = await col.applications().findOne(
    { tuitionId, studentEmail: req.user.email },
    { projection: { status: 1 } }
  );
  res.json({ applied: Boolean(application), status: application?.status || null });
}));

// DELETE /applications/:id  (student cancels a pending application)
router.delete("/:id", verifyToken, verifyStudent, h(async (req, res) => {
  const _id = oid(req.params.id);
  if (!_id) return res.status(400).json({ message: "Invalid application id." });

  const application = await col.applications().findOne({ _id });
  if (!application) return res.status(404).json({ message: "Application not found." });
  if (application.studentEmail !== req.user.email) {
    return res.status(403).json({ message: "You can only cancel your own applications." });
  }
  if (application.status !== "pending") {
    return res
      .status(400)
      .json({ message: "Only pending applications can be cancelled." });
  }

  await col.applications().deleteOne({ _id });
  res.json({ deleted: true });
}));

// PATCH /applications/:id/status  (tutor accepts / rejects)
router.patch("/:id/status", verifyToken, verifyTutor, h(async (req, res) => {
  const _id = oid(req.params.id);
  if (!_id) return res.status(400).json({ message: "Invalid application id." });

  const status = String(req.body?.status || "");
  if (!["accepted", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Status must be accepted or rejected." });
  }

  const application = await col.applications().findOne({ _id });
  if (!application) return res.status(404).json({ message: "Application not found." });
  if (application.tutorEmail !== req.user.email) {
    return res
      .status(403)
      .json({ message: "You can only manage applications for your own tuitions." });
  }

  await col.applications().updateOne({ _id }, { $set: { status, updatedAt: new Date() } });
  res.json({ ...application, status });
}));

export default router;
