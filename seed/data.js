// Realistic connected demo data for MentorLagbe.
// Passwords for the demo accounts are created by client/scripts/seed-users.mjs

const img = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=80`;

export const tutors = {
  nusrat: { name: "Nusrat Jahan", email: "tutor@mentorlagbe.com" },
  rafiul: { name: "Rafiul Karim", email: "tutor2@mentorlagbe.com", pro: true },
  tasnim: { name: "Tasnim Akter", email: "tutor3@mentorlagbe.com" },
  arif: { name: "Arif Hossain", email: "tutor4@mentorlagbe.com" },
  sadia: { name: "Sadia Rahman", email: "tutor5@mentorlagbe.com", pro: true },
  mahmud: { name: "Mahmudul Hasan", email: "tutor6@mentorlagbe.com" },
};

export const students = {
  ayesha: { name: "Ayesha Siddiqua", email: "student@mentorlagbe.com" },
  tanvir: { name: "Tanvir Ahmed", email: "student2@mentorlagbe.com", pro: true },
  mim: { name: "Mim Chowdhury", email: "student3@mentorlagbe.com" },
};

const t = (tutor, data) => ({
  tutorName: tutors[tutor].name,
  tutorEmail: tutors[tutor].email,
  approvalStatus: "approved",
  isActive: true,
  ...data,
});

export const tuitions = [
  t("nusrat", {
    title: "SSC Mathematics Mastery Batch",
    subject: "Mathematics",
    classLevel: "Class 9-10",
    mode: "Offline",
    location: "Dhanmondi, Dhaka",
    monthlyFee: 4500,
    daysPerWeek: 3,
    bannerImage: img("photo-1635070041078-e363dbe005cb"),
    description:
      "A small-batch SSC mathematics course covering algebra, geometry and trigonometry. Every class ends with a timed practice set and weekly model tests, so students build speed along with concepts.",
  }),
  t("rafiul", {
    title: "Python & Problem Solving from Scratch",
    subject: "Programming",
    classLevel: "University",
    mode: "Online",
    location: "Online (Google Meet)",
    monthlyFee: 6000,
    daysPerWeek: 2,
    bannerImage: img("photo-1555066931-4365d14bab8c"),
    description:
      "Start Python from zero and move to loops, functions, data structures and real problem solving. Live coding sessions, recorded classes and a mini project every month.",
  }),
  t("rafiul", {
    title: "Full-Stack Web Development Mentorship",
    subject: "Programming",
    classLevel: "Professional",
    mode: "Online",
    location: "Online (Zoom)",
    monthlyFee: 8000,
    daysPerWeek: 3,
    bannerImage: img("photo-1498050108023-c5249f4df085"),
    description:
      "One-on-one style mentorship for aspiring web developers. HTML, CSS, JavaScript, React, Node and MongoDB with code reviews, portfolio projects and interview preparation.",
  }),
  t("rafiul", {
    title: "ICT Basics for Class 6-8",
    subject: "ICT",
    classLevel: "Class 6-8",
    mode: "Online",
    location: "Online (Google Meet)",
    monthlyFee: 3000,
    daysPerWeek: 2,
    bannerImage: img("photo-1516321318423-f06f85e504b3"),
    description:
      "Friendly introduction to computers, the internet, safe browsing, typing and basic coding with Scratch. Perfect for young learners who want to be confident with technology.",
  }),
  t("tasnim", {
    title: "IELTS Band 7+ Crash Course",
    subject: "IELTS",
    classLevel: "Professional",
    mode: "Online",
    location: "Online (Zoom)",
    monthlyFee: 7000,
    daysPerWeek: 4,
    bannerImage: img("photo-1434030216411-0b793f4b4173"),
    description:
      "Focused preparation for all four IELTS modules with weekly mock tests, speaking practice and personal writing feedback. Ideal for students planning to study abroad.",
  }),
  t("tasnim", {
    title: "Spoken English for Confident Speaking",
    subject: "English",
    classLevel: "Class 9-10",
    mode: "Offline",
    location: "Sector 7, Uttara, Dhaka",
    monthlyFee: 3500,
    daysPerWeek: 3,
    bannerImage: img("photo-1522202176988-66273c2fd55f"),
    description:
      "Daily conversation practice, pronunciation, vocabulary and presentation skills. Students speak in every class through role plays, group discussions and short talks.",
  }),
  t("arif", {
    title: "HSC Chemistry Concept Clinic",
    subject: "Chemistry",
    classLevel: "HSC",
    mode: "Offline",
    location: "Mirpur 10, Dhaka",
    monthlyFee: 4800,
    daysPerWeek: 3,
    bannerImage: img("photo-1532094349884-543bc11b234d"),
    description:
      "Concept-first teaching of organic, physical and inorganic chemistry for HSC. Includes chapter-wise board question practice and doubt-clearing sessions every Friday.",
  }),
  t("arif", {
    title: "Biology Olympiad & Admission Prep",
    subject: "Biology",
    classLevel: "Admission Prep",
    mode: "Online",
    location: "Online (Google Meet)",
    monthlyFee: 5500,
    daysPerWeek: 3,
    bannerImage: img("photo-1507413245164-6160d8298b31"),
    description:
      "Deep biology preparation for medical admission and olympiads. Diagram practice, MCQ strategy and previous year question analysis with weekly exams.",
  }),
  t("sadia", {
    title: "HSC Accounting Complete Course",
    subject: "Accounting",
    classLevel: "HSC",
    mode: "Offline",
    location: "GEC Circle, Chattogram",
    monthlyFee: 4200,
    daysPerWeek: 3,
    bannerImage: img("photo-1554224155-6726b3ff858f"),
    description:
      "Step-by-step HSC accounting from journal entries to final accounts. Plenty of solved examples, creative question practice and revision before every exam.",
  }),
  t("sadia", {
    title: "Business Studies for O Level",
    subject: "Business",
    classLevel: "O Level",
    mode: "Online",
    location: "Online (Zoom)",
    monthlyFee: 6500,
    daysPerWeek: 2,
    bannerImage: img("photo-1454165804606-c3d57bc86b40"),
    description:
      "Cambridge O Level Business Studies with real-world case studies, past paper practice and exam technique coaching for confident answers.",
  }),
  t("mahmud", {
    title: "Physics Fundamentals for SSC",
    subject: "Physics",
    classLevel: "Class 9-10",
    mode: "Offline",
    location: "Zindabazar, Sylhet",
    monthlyFee: 4000,
    daysPerWeek: 3,
    bannerImage: img("photo-1509062522246-3755977927d7"),
    description:
      "Clear explanations of motion, force, energy and electricity using everyday examples and simple experiments. Numerical practice is included in every class.",
  }),
  t("mahmud", {
    title: "A Level Physics Problem Solving",
    subject: "Physics",
    classLevel: "A Level",
    mode: "Online",
    location: "Online (Zoom)",
    monthlyFee: 9000,
    daysPerWeek: 2,
    bannerImage: img("photo-1427504494785-3a9ca7044f45"),
    description:
      "Advanced problem solving for Cambridge A Level Physics. Past paper walkthroughs, mark scheme analysis and one-to-one doubt sessions for tough topics.",
  }),

  // Extra posts so the dashboards show every status
  t("rafiul", {
    title: "Data Structures with C++",
    subject: "Programming",
    classLevel: "University",
    mode: "Online",
    location: "Online (Google Meet)",
    monthlyFee: 6500,
    daysPerWeek: 3,
    approvalStatus: "pending",
    bannerImage: img("photo-1517694712202-14dd9538aa97"),
    description:
      "Learn arrays, linked lists, stacks, queues, trees and graphs in C++ with contest-style problems and weekly coding tests.",
  }),
  t("sadia", {
    title: "IGCSE Economics Crash Course",
    subject: "Economics",
    classLevel: "O Level",
    mode: "Online",
    location: "Online (Zoom)",
    monthlyFee: 7500,
    daysPerWeek: 2,
    approvalStatus: "pending",
    bannerImage: img("photo-1513258496099-48168024aec0"),
    description:
      "Fast, exam-focused revision of IGCSE Economics with essay structuring, data response practice and topic summaries.",
  }),
  t("mahmud", {
    title: "Guaranteed A+ in Just 7 Days",
    subject: "Physics",
    classLevel: "Class 9-10",
    mode: "Online",
    location: "Online",
    monthlyFee: 1500,
    daysPerWeek: 7,
    approvalStatus: "rejected",
    bannerImage: img("photo-1523240795612-9a054b0db644"),
    description:
      "Quick revision for last minute learners. This post was rejected because the promise in the title is unrealistic.",
  }),
  t("mahmud", {
    title: "Primary All-Subject Home Tutor",
    subject: "General",
    classLevel: "Class 1-5",
    mode: "Offline",
    location: "Ambarkhana, Sylhet",
    monthlyFee: 3000,
    daysPerWeek: 5,
    isActive: false,
    bannerImage: img("photo-1503676260728-1c00da094a0b"),
    description:
      "Home tutoring for primary students in all subjects with homework support and weekly progress reports. Currently closed for new students.",
  }),
];

// [studentKey, tuition title, status, phone, schedule, note, daysAgo]
export const applications = [
  ["ayesha", "SSC Mathematics Mastery Batch", "accepted", "01711000001", "Sat, Mon, Wed - 5 PM", "I find geometry difficult and want to improve before the test exam.", 9],
  ["tanvir", "SSC Mathematics Mastery Batch", "pending", "01711000002", "Sun, Tue, Thu - 6 PM", "Please let me know if there is a seat in the evening batch.", 4],
  ["mim", "SSC Mathematics Mastery Batch", "pending", "01711000003", "Fri morning and Sat evening", "Looking for extra practice on algebra problems.", 2],
  ["ayesha", "Python & Problem Solving from Scratch", "pending", "01711000001", "Weekends after 8 PM", "Complete beginner, excited to start coding.", 3],
  ["ayesha", "HSC Chemistry Concept Clinic", "rejected", "01711000001", "Mon, Wed, Fri - 4 PM", "I need help with organic chemistry reactions.", 12],
  ["tanvir", "HSC Accounting Complete Course", "accepted", "01711000002", "Sat, Mon, Wed - 7 PM", "Preparing for HSC and want to revise final accounts.", 15],
  ["mim", "Physics Fundamentals for SSC", "accepted", "01711000003", "Tue, Thu, Sat - 5 PM", "Numerical problems are my weak point.", 7],
  ["mim", "IELTS Band 7+ Crash Course", "pending", "01711000003", "Evenings, any day", "Targeting band 7 in the next three months.", 1],
];

// [user key, "tutor" | "student", days ago]
export const payments = [
  ["rafiul", "tutor", 30],
  ["sadia", "tutor", 18],
  ["tanvir", "student", 6],
];
