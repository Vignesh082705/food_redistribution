import { checkRejectedRequests } from "./cron-logic";

export default async function handler(req, res) {
  await checkRejectedRequests();
  res.status(200).send("✅ Rejected requests checked.");
}
