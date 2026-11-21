import { Router } from "express";
import { col, oid, ObjectId } from "../db.js";
import { verifyStudent, verifyToken } from "../middleware/auth.js";
import { cleanProfile } from "../validators.js";
import { h } from "../utils.js";

const router = Router();

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  image: user.image || null,
  role: user.role || "student",
  plan: user.plan || "free",
  phone: user.phone || "",
  bio: user.bio || "",
  createdAt: user.createdAt,
  savedTuitions: (user.savedTuitions || []).map(String),
});

// GET /users/me
router.get("/me", verifyToken, h(async (req, res) => {
  const user = await col.users().findOne({ email: req.user.email });
  res.json(publicUser(user));
}));

// PATCH /users/me  (Update Profile page)
router.patch("/me", verifyToken, h(async (req, res) => {
  const { data, error } = cleanProfile(req.body);
  if (error) return res.status(400).json({ message: error });

  await col.users().updateOne(
    { email: req.user.email },
    { $set: { ...data, updatedAt: new Date() } }
  );
  const user = await col.users().findOne({ email: req.user.email });
  res.json(publicUser(user));
}));

// GET /users/me/saved  (bookmarked tuitions)
router.get("/me/saved", verifyToken, verifyStudent, h(async (req, res) => {
  const user = await col.users().findOne({ email: req.user.email });
  const ids = (user.savedTuitions || []).map((id) => new ObjectId(id));
  if (ids.length === 0) return res.json([]);

  const tuitions = await col
    .tuitions()
    .find({ _id: { $in: ids }, approvalStatus: "approved", isActive: true })
    .toArray();
  res.json(tuitions);
}));

// POST /users/me/saved/:tuitionId  (toggle a bookmark)
router.post("/me/saved/:tuitionId", verifyToken, verifyStudent, h(async (req, res) => {
  const tuitionId = oid(req.params.tuitionId);
  if (!tuitionId) return res.status(400).json({ message: "Invalid tuition id." });

  const user = await col.users().findOne({ email: req.user.email });
  const saved = (user.savedTuitions || []).some((id) => String(id) === String(tuitionId));

  await col.users().updateOne(
    { email: req.user.email },
    saved
      ? { $pull: { savedTuitions: tuitionId } }
      : { $addToSet: { savedTuitions: tuitionId } }
  );
  res.json({ saved: !saved });
}));

export default router;
