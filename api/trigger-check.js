import {
    checkExpiringDonations,
    checkPendingPickupExpiry
  } from "../lib/cron-logic.js";
  
  export default async function handler(req, res) {
    await checkExpiringDonations();
    await checkPendingPickupExpiry();
    res.status(200).json({ message: "✅ Trigger executed" });
  }
  