import { MongoClient, ObjectId } from "mongodb";

let db;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing in server/.env");

  const client = new MongoClient(uri);
  await client.connect();
  db = client.db(process.env.MONGODB_DB_NAME || "mentorlagbe");

  // Indexes: they also enforce "no duplicate applications" and
  // "one payment record per Stripe session" at the database level.
  try {
    await Promise.all([
      db.collection("applications").createIndex(
        { tuitionId: 1, studentEmail: 1 },
        { unique: true }
      ),
      db.collection("payments").createIndex({ stripeSessionId: 1 }, { unique: true }),
      db.collection("tuitions").createIndex({ approvalStatus: 1, isActive: 1, createdAt: -1 }),
      db.collection("tuitions").createIndex({ tutorEmail: 1 }),
      db.collection("users").createIndex({ email: 1 }),
    ]);
  } catch (error) {
    console.warn("Index creation warning:", error.message);
  }

  console.log("MongoDB connected:", db.databaseName);
  return db;
}

// "users" is the collection BetterAuth writes to (see client/src/lib/auth.ts)
export const col = {
  users: () => db.collection("users"),
  tuitions: () => db.collection("tuitions"),
  applications: () => db.collection("applications"),
  payments: () => db.collection("payments"),
};

export const oid = (id) =>
  typeof id === "string" && /^[a-f\d]{24}$/i.test(id) ? new ObjectId(id) : null;

export { ObjectId };
