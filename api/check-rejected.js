import { checkRejectedRequests } from "../lib/cron-logic.js";

export default async function handler(req, res) {
  await checkRejectedRequests();
  res.status(200).json({ message: "✅ Rejected check done" });
}
