import jwt from "jsonwebtoken";
import { col } from "../db.js";

function readToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

async function loadUser(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ["HS256"],
  });

  // The role and plan always come from the database, never from the token,
  // so a role change by an admin applies immediately.
  const user = await col.users().findOne({ email: payload.email });
  if (!user) return null;

  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    image: user.image || null,
    role: user.role || "student",
    plan: user.plan || "free",
  };
}

// 1) verifyToken: the request must carry a valid JWT
export async function verifyToken(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ message: "Authentication required." });

  try {
    const user = await loadUser(token);
    if (!user) return res.status(401).json({ message: "Account not found." });
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Your session has expired. Please sign in again." });
    }
    next(error);
  }
}

// Same as verifyToken but never blocks: used by public routes that
// show extra data to the owner / admin.
export async function optionalAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) return next();
  try {
    req.user = (await loadUser(token)) || undefined;
  } catch {
    req.user = undefined;
  }
  next();
}

// 2) Role middlewares: always used after verifyToken
const requireRole = (role, label) => (req, res, next) => {
  if (req.user?.role !== role) {
    return res.status(403).json({ message: `Only ${label} accounts can do this.` });
  }
  next();
};

export const verifyStudent = requireRole("student", "student");
export const verifyTutor = requireRole("tutor", "tutor");
export const verifyAdmin = requireRole("admin", "admin");
