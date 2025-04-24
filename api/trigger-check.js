import { checkExpiringDonations, checkPendingPickupExpiry } from "./cron-logic";

export default async function handler(req, res) {
  await checkExpiringDonations();
  await checkPendingPickupExpiry();
  res.status(200).send("✅ Expiry checks triggered.");
}
