import admin from "firebase-admin";


if (!admin.apps.length) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_KEY_BASE64, "base64").toString("utf8")
    );
  
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DB_URL,
    });
  }

const db = admin.database();

function convertTo24Hour(time12h) {
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":");
  if (modifier === "PM" && hours !== "12") hours = String(parseInt(hours) + 12);
  if (modifier === "AM" && hours === "12") hours = "00";
  return `${hours}:${minutes}`;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function fetchNearbyVolunteers(lat, lon) {
  const volunteers = [];
  const snapshot = await db.ref("volunteer").once("value");

  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      const user = child.val();
      if (user.role === "Volunteer") {
        const distance = calculateDistance(lat, lon, user.lat, user.lon);
        if (distance <= 5) {
          volunteers.push({ id: child.key, ...user });
        }
      }
    });
  }

  return volunteers;
}
export async function checkRejectedRequests() {
    const requestsRef = db.ref("requests");
    const snapshot = await requestsRef.once("value");
    const data = snapshot.val();
  
    if (!data) return;
  
    const updates = {};
    const notificationPromises = [];
  
    for (const key of Object.keys(data)) {
      const request = data[key];
  
      const donors = request.donors || {};
      const donorStatuses = Object.values(donors).map(d => d?.status);
      const allRejected = donorStatuses.length > 0 && donorStatuses.every(status => status === "Rejected");
  
      if (allRejected && request.status !== "Rejected") {
        updates[`requests/${key}/status`] = "Rejected";
  
        const notificationRef = db.ref(`notifications/recipients/${request.userId}`).push();
        const notify = notificationRef.set({
          message: "Your request was rejected by all donors.",
          createdAt: Date.now(),
          requestId: key,
          read: false,
        });
  
        notificationPromises.push(notify);
      }
    }
  
    if (Object.keys(updates).length > 0) {
      await db.ref().update(updates);
    }
  
    if (notificationPromises.length > 0) {
      await Promise.all(notificationPromises);
    }
  
  }
   

export async function checkExpiringDonations() {
  const snapshot = await db.ref("donations").once("value");
  if (!snapshot.exists()) return;

  const donations = snapshot.val();
  const now = new Date();

  for (const [donationId, donation] of Object.entries(donations)) {
    const expiryTime = new Date(`${donation.date}T${convertTo24Hour(donation.time)}`);
    const minutesLeft = (expiryTime - now) / (1000 * 60);

    if (
      donation.status === "Pending" &&
      minutesLeft <= 30 &&
      minutesLeft >= 25 &&
      !donation.notified30min
    ) {
      const volunteers = await fetchNearbyVolunteers(donation.latitude, donation.longitude);
      for (const vol of volunteers) {
        await db.ref(`notifications/volunteers/${vol.id}`).push({
          donationId,
          type:"donation",
          message: `${donation.foodType} at ${donation.pickupLocation} will expire in 30 minutes.Can you donate it for others.`,
          read: false,
          createdAt: Date.now(),
        });
      }

      const recipients = donation.recipients || {};
      for (const recipientId in recipients) {
        await db.ref(`notifications/recipients/${recipientId}`).push({
          message: `${donation.foodType} will expire in 30 minutes.`,
          read: false,
          type:"donation",
          donationId,
          createdAt: Date.now(),
        });
      }

      await db.ref(`notifications/donors/${donation.userId}`).push({
        message: `${donation.foodType} at ${donation.pickupLocation} will expire in 30 minutes. Volunteers have been notified.`,
        read: false,
        type:"donation",
        donationId,
        createdAt: Date.now(),
      });

      await db.ref(`donations/${donationId}`).update({ notified30min: true });
    }

    if (
      donation.status === "Pending" &&
      minutesLeft <= 20 &&
      minutesLeft >= 15 &&
      !donation.notified15min
    ) {
      const volunteers = await fetchNearbyVolunteers(donation.latitude, donation.longitude);
      for (const vol of volunteers) {
        await db.ref(`notifications/volunteers/${vol.id}`).push({
          donationId,
          type:"donation",
          message: `${donation.foodType} is about to expire in 15 minutes!`,
          read: false,
          createdAt: Date.now(),
        });
      }

      const recipients = donation.recipients || {};
      for (const recipientId in recipients) {
        await db.ref(`notifications/recipients/${recipientId}`).push({
          message: `${donation.foodType} at ${donation.pickupLocation} will expire in 15 minutes.`,
          read: false,
          type:"donation",
          donationId,
          createdAt: Date.now(),
        });
      }

      await db.ref(`donations/${donationId}`).update({ notified15min: true });
    }
    if (
        donation.status === "Pending" && // Only process donations with "Pending" status
        minutesLeft <= 0
      ) {
        // Mark donation as expired
        await db.ref(`donations/${donationId}`).update({ status: "Expired" });
  
        // Notify volunteers about the expiration
        const volunteers = await fetchNearbyVolunteers(donation.latitude, donation.longitude);
        for (const vol of volunteers) {
          await db.ref(`notifications/volunteers/${vol.id}`).push({
            donationId,
            type:"donation",
            message: `${donation.foodType} at ${donation.pickupLocation} has expired and is no longer available.`,
            read: false,
            createdAt: Date.now(),
          });
        }
  
        // Notify recipients about the expiration
        const recipients = donation.recipients || {};
        for (const recipientId in recipients) {
          await db.ref(`notifications/recipients/${recipientId}`).push({
            message: `${donation.foodType} at ${donation.pickupLocation} has expired.`,
            read: false,
            type:"donation",
            donationId,
            createdAt: Date.now(),
          });
        }
  
        // Notify donors about the expiration
        await db.ref(`notifications/donors/${donation.userId}`).push({
          message: `${donation.foodType} at ${donation.pickupLocation} has expired.`,
          read: false,
          type:"donation",
          donationId,
          createdAt: Date.now(),
        });
      }
  }
}

export async function checkPendingPickupExpiry() {
  const snapshot = await db.ref("donations").once("value");
  if (!snapshot.exists()) return;

  const donations = snapshot.val();
  const now = new Date();

  for (const [donationId, donation] of Object.entries(donations)) {
    if (donation.status === "Volunteer Assigned" && donation.pickupRequests) {
      const pickupRequests = donation.pickupRequests;

      for (const [requestId, request] of Object.entries(pickupRequests)) {
        const volunteerStatus = request.status;

        if (volunteerStatus === "Pending") {
          const donationDateTime = new Date(`${donation.date}T${convertTo24Hour(donation.time)}`);
          const diffInMinutes = (donationDateTime - now) / (1000 * 60);

          if (diffInMinutes <= 20 && !donation.notified20min) {
            // Reject request
            await db.ref(`donations/${donationId}/pickupRequests/${requestId}`).update({
              status: "Rejected"
            });
            await db.ref(`notifications/volunteers/${requestId}`).push({
              message: "Food is Expired Soon so That Pickup request will be rejected and notified the donor and recipient..",
              donationId,
              role:"volunteer",
              type: "donation",
              createdAt: Date.now(),
              read: false,
            });

            // Flag to avoid duplicate notifications
            await db.ref(`donations/${donationId}`).update({
              notified20min: true
            });

            // Notify Donor
            await db.ref(`notifications/donors/${donation.userId}`).push({
              message: "A recipient accepted your food but the volunteer didn't respond in time. Searching for alternatives.",
              donationId,
              type: "donation",
              createdAt: Date.now(),
              read: false,
            });

            // Notify Recipient
            if (donation.recipientId) {
              await db.ref(`notifications/recipients/${donation.recipientId}`).push({
                message: "Your volunteer request is pending for too long. Searching for alternative support.",
                donationId,
                type: "donation",
                createdAt: Date.now(),
                read: false,
              });
            }
          }
        }
      }
    }
  }
}
