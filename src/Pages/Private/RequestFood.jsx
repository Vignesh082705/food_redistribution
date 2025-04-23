import React, { useState, useEffect } from "react";
import { ref, push, get,update } from "firebase/database";
import { database, auth } from "../../firebase";
import Swal from "sweetalert2";

function RequestFood() {
  const [formData, setFormData] = useState({
    foodType: "",
    quantity: "",
    date: "",
    time: "",
    message: "",
    urgency: "",
    deliveryOption: "",
  });
  const [loading, setLoading] = useState(false);
  const [recipientLocation, setRecipientLocation] = useState(null);

  useEffect(() => {
    const fetchUserLocation = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const recipientSnapshot = await get(ref(database, `recipient/${user.uid}`));
      if (recipientSnapshot.exists()) {
        const recipientData = recipientSnapshot.val();
        if (recipientData.lat && recipientData.lon) {
          setRecipientLocation({ lat: recipientData.lat, lon: recipientData.lon });
        }
      }
    };
    fetchUserLocation();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateExpiryTime = (date, time) => {
    const expiryDate = new Date(`${date}T${time}`);
    expiryDate.setHours(expiryDate.getHours() + 4);
    return expiryDate.toISOString();
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getNearbyDonors = async () => {
    if (!recipientLocation) {
      console.log("Recipient location not found!");
      return [];
    }
  
    console.log("Recipient Location:", recipientLocation.lat, recipientLocation.lon);
  
    const donorSnapshot = await get(ref(database, "donor"));
    if (!donorSnapshot.exists()) {
      console.log("No donors found in Firebase!");
      return [];
    }
  
    const donors = donorSnapshot.val();
    const nearbyDonors = [];
  
    Object.keys(donors).forEach((donorId) => {
      const donor = donors[donorId];
  
      if (donor.lat && donor.lon) {
        const distance = getDistance(
          recipientLocation.lat,  
          recipientLocation.lon,  
          donor.lat,
          donor.lon
        );
  
        console.log(`Checking Donor ${donorId} at (${donor.lat}, ${donor.lon})`);
        console.log(`Calculated Distance: ${distance} km`);
  
        if (distance <= 5) {
          nearbyDonors.push(donorId);
        }
      } else {
        console.log(`Donor ${donorId} has missing lat/lon`);
      }
    });
  
    console.log("Nearby Donors Found:", nearbyDonors);
    return nearbyDonors;
  };
  
  
  const sendNotification = async (donorId, requestId) => {
    const notificationRef = ref(database, `notifications/donors/${donorId}`);
    await push(notificationRef, {
      requestId:requestId,
      type:"request",
      message: "A new food request is available near you!",
      createdAt: Date.now(),
      read: false,
    });
  };

 
const handleSubmit = async (e) => {
  e.preventDefault();

  const result = await Swal.fire({
    title: "Confirm Request",
    text: "Do you want to request the food?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, Request Food",
    cancelButtonText: "No, Cancel",
  });

  if (!result.isConfirmed) {
    return; // User cancelled
  }

  setLoading(true);
  const user = auth.currentUser;

  if (!user) {
    Swal.fire({
      icon: "warning",
      title: "Login Required",
      text: "You must be logged in to request food.",
    });
    setLoading(false);
    return;
  }

  if (!formData.foodType || !formData.quantity || !formData.date || !formData.time || !formData.urgency) {
    Swal.fire({
      icon: "error",
      title: "Incomplete Details",
      text: "Please fill in all required fields.",
    });
    setLoading(false);
    return;
  }

  try {
    const nearbyDonors = await getNearbyDonors();
    if (nearbyDonors.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Donors Nearby",
        text: "No nearby donors available within 5km.",
      });
      setLoading(false);
      return;
    }

    const requestData = {
      ...formData,
      userId: user.uid,
      createdAt: Date.now(),
      expiryTime: calculateExpiryTime(formData.date, formData.time),
      status: "Pending",
      deliverylocation: recipientLocation
        ? {
            lat: recipientLocation.lat,
            lon: recipientLocation.lon,
          }
        : null,
      deliveryOption: formData.deliveryOption === "Need Delivery",
      donors: {},
    };

    nearbyDonors.forEach((donorId) => {
      requestData.donors[donorId] = { status: "Pending" };
    });

    const requestRef = await push(ref(database, "requests"), requestData);
    const requestId = requestRef.key;

    nearbyDonors.forEach((donorId) => {
      sendNotification(donorId, requestId);
    });

    const recipientRef = ref(database, `recipient/${user.uid}`);
    const recipientSnap = await get(recipientRef);
    const recipientData = recipientSnap.val();
    const currentRequests = recipientData?.foodRequests || 0;

    await update(recipientRef, {
      foodRequests: currentRequests + 1,
    });

    Swal.fire({
      icon: "success",
      title: "Request Submitted",
      text: "Your food request has been submitted successfully!",
    });

    setFormData({
      foodType: "",
      quantity: "",
      date: "",
      deliverylocation: "",
      time: "",
      message: "",
      urgency: "",
      deliveryOption: "",
    });
  } catch (error) {
    console.error("Error submitting request:", error);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Failed to submit request. Please try again.",
    });
  }

  setLoading(false);
};

  return (
    <div className="max-w-lg mx-auto bg-white p-6 shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-4 text-[#DE3163]">Request Food</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">Food Type:</label>
        <select name="foodType" value={formData.foodType} onChange={handleChange} className="w-full border p-2 rounded mb-3" required>
          <option value="">Select Food Type</option>
          <option value="Cooked Meal">Cooked Meal</option>
          <option value="Tiffin">Tiffin</option>
          <option value="Groceries">Groceries</option>
        </select>

        <label className="block mb-2">Quantity (kg):</label>
        <input type="number" min="1" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full border p-2 rounded mb-3" required />

        <label className="block mb-2">Request Date:</label>
        <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full border p-2 rounded mb-3" min={new Date().toISOString().split("T")[0]} required />

        <label className="block mb-2">Preferred Time:</label>
        <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full border p-2 rounded mb-3" required />

        <label className="block mb-2">Urgency Level:</label>
        <select name="urgency" value={formData.urgency} onChange={handleChange} className="w-full border p-2 rounded mb-3" required>
          <option value="">Select Urgency</option>
          <option value="Immediate">Immediate</option>
          <option value="Few Hours">Few Hours</option>
          <option value="Anytime">Anytime</option>
        </select>

        <label className="block mb-2">Request Reason (Optional):</label>
        <textarea name="message" value={formData.message} onChange={handleChange} className="w-full border p-2 rounded mb-3"></textarea>

        <label className="block mb-2">Pickup or Delivery:</label>
        <select name="deliveryOption" value={formData.deliveryOption} onChange={handleChange} className="w-full border p-2 rounded mb-3" required>
          <option value="">Select Option</option>
          <option value="I will pick up">I will pick up</option>
          <option value="Need Delivery">Need Delivery</option>
        </select>

        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded disabled:opacity-50" disabled={loading}>
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}

export default RequestFood;
