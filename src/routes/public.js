import { Router } from "express";
import { col } from "../db.js";
import { h } from "../utils.js";

const router = Router();

// GET /public/stats  (home page counters + top subjects)
router.get("/stats", h(async (_req, res) => {
  const live = { approvalStatus: "approved", isActive: true };

  const [tutors, students, tuitions, subjects] = await Promise.all([
    col.users().countDocuments({ role: "tutor" }),
    col.users().countDocuments({ role: "student" }),
    col.tuitions().countDocuments(live),
    col.tuitions().aggregate([
      { $match: live },
      { $group: { _id: "$subject", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 12 },
    ]).toArray(),
  ]);

  res.json({
    tutors,
    students,
    tuitions,
    subjects: subjects.map((s) => ({ subject: s._id, count: s.count })),
  });
}));

export default router;
