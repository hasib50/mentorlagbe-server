import "dotenv/config";
import "../src/dns-fix.js";
import { connectDB, col } from "../src/db.js";
import { PLANS } from "../src/constants.js";
import { tuitions, applications, payments, tutors, students } from "./data.js";

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);

async function main() {
  await connectDB();

  // Only documents created by this script are removed, real data is kept
  await Promise.all([
    col.tuitions().deleteMany({ seed: true }),
    col.applications().deleteMany({ seed: true }),
    col.payments().deleteMany({ seed: true }),
  ]);

  const tuitionDocs = tuitions.map((tuition, index) => ({
    ...tuition,
    seed: true,
    createdAt: daysAgo(40 - index * 2),
  }));
  const inserted = await col.tuitions().insertMany(tuitionDocs);
  const idByTitle = new Map(
    tuitionDocs.map((tuition, index) => [tuition.title, inserted.insertedIds[index]])
  );

  const applicationDocs = applications.map(
    ([studentKey, title, status, phone, schedule, note, ago]) => {
      const tuition = tuitionDocs.find((item) => item.title === title);
      return {
        tuitionId: idByTitle.get(title),
        tuitionTitle: title,
        subject: tuition.subject,
        monthlyFee: tuition.monthlyFee,
        tutorEmail: tuition.tutorEmail,
        tutorName: tuition.tutorName,
        studentName: students[studentKey].name,
        studentEmail: students[studentKey].email,
        studentPhone: phone,
        preferredSchedule: schedule,
        studentNote: note,
        status,
        appliedAt: daysAgo(ago),
        seed: true,
      };
    }
  );
  await col.applications().insertMany(applicationDocs);

  const accounts = { ...tutors, ...students };
  const paymentDocs = payments.map(([key, role, ago], index) => ({
    userEmail: accounts[key].email,
    userName: accounts[key].name,
    userRole: role,
    planName: PLANS[role].name,
    amount: PLANS[role].amount,
    currency: "usd",
    transactionId: `pi_seed_${index + 1}_${key}`,
    stripeSessionId: `cs_test_seed_${index + 1}_${key}`,
    paymentStatus: "paid",
    paidAt: daysAgo(ago),
    seed: true,
  }));
  await col.payments().insertMany(paymentDocs);

  // Mark the paying demo users as Pro (they exist after seed-users.mjs ran)
  const proEmails = paymentDocs.map((payment) => payment.userEmail);
  const upgraded = await col.users().updateMany(
    { email: { $in: proEmails } },
    { $set: { plan: "pro" } }
  );

  console.log(
    `Seeded ${tuitionDocs.length} tuitions, ${applicationDocs.length} applications, ${paymentDocs.length} payments.`
  );
  console.log(`Upgraded ${upgraded.modifiedCount} demo users to Pro.`);
  if (upgraded.matchedCount < proEmails.length) {
    console.log("Tip: run `npm run seed:users` in the client first so the demo accounts exist.");
  }
  process.exit(0);
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
