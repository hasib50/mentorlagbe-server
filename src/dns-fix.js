import dns from "dns";

// Only needed on some local networks; skip it on Vercel.
if (!process.env.VERCEL) dns.setServers(["8.8.8.8", "1.1.1.1"]);