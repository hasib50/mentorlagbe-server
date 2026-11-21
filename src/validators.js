import { CLASS_LEVELS, MODES } from "./constants.js";
import { isUrl } from "./utils.js";

const text = (value) => String(value ?? "").trim();

export function cleanTuition(body = {}) {
  const data = {
    title: text(body.title),
    subject: text(body.subject),
    classLevel: text(body.classLevel),
    mode: text(body.mode),
    location: text(body.location),
    monthlyFee: Number(body.monthlyFee),
    daysPerWeek: Number(body.daysPerWeek),
    bannerImage: text(body.bannerImage),
    description: text(body.description),
  };

  if (data.title.length < 5 || data.title.length > 120)
    return { error: "Title must be between 5 and 120 characters." };
  if (data.subject.length < 2 || data.subject.length > 60)
    return { error: "Subject must be between 2 and 60 characters." };
  if (!CLASS_LEVELS.includes(data.classLevel))
    return { error: "Please choose a valid class level." };
  if (!MODES.includes(data.mode))
    return { error: "Mode must be Online or Offline." };
  if (data.mode === "Offline" && data.location.length < 3)
    return { error: "Please enter the location for offline tuition." };
  if (data.mode === "Online" && !data.location) data.location = "Online";
  if (!Number.isFinite(data.monthlyFee) || data.monthlyFee < 100 || data.monthlyFee > 500000)
    return { error: "Monthly fee must be between 100 and 500,000." };
  if (!Number.isInteger(data.daysPerWeek) || data.daysPerWeek < 1 || data.daysPerWeek > 7)
    return { error: "Days per week must be between 1 and 7." };
  if (!isUrl(data.bannerImage))
    return { error: "A banner image is required." };
  if (data.description.length < 20 || data.description.length > 2000)
    return { error: "Description must be between 20 and 2000 characters." };

  return { data };
}

export function cleanProfile(body = {}) {
  const data = {};

  if (body.name !== undefined) {
    const name = text(body.name);
    if (name.length < 2 || name.length > 60)
      return { error: "Name must be between 2 and 60 characters." };
    data.name = name;
  }
  if (body.phone !== undefined) {
    const phone = text(body.phone);
    if (phone && !/^[+\d][\d\s-]{6,17}$/.test(phone))
      return { error: "Please enter a valid phone number." };
    data.phone = phone;
  }
  if (body.bio !== undefined) {
    const bio = text(body.bio);
    if (bio.length > 400) return { error: "Bio must be 400 characters or fewer." };
    data.bio = bio;
  }
  if (body.image !== undefined) {
    const image = text(body.image);
    if (image && !isUrl(image)) return { error: "Profile image must be a valid URL." };
    data.image = image || null;
  }

  return { data };
}

export function cleanApplication(body = {}) {
  const data = {
    studentPhone: text(body.studentPhone),
    preferredSchedule: text(body.preferredSchedule),
    studentNote: text(body.studentNote),
  };

  if (!/^[+\d][\d\s-]{6,17}$/.test(data.studentPhone))
    return { error: "Please enter a valid phone number." };
  if (data.preferredSchedule.length < 3 || data.preferredSchedule.length > 120)
    return { error: "Preferred schedule must be between 3 and 120 characters." };
  if (data.studentNote.length < 5 || data.studentNote.length > 500)
    return { error: "Learning note must be between 5 and 500 characters." };

  return { data };
}
