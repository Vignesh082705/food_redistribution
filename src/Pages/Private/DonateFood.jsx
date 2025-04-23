import React, { useState, useEffect } from "react";
import { database, auth, ref, push,set, get, query, orderByChild,update,getDatabase} from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { serverTimestamp, equalTo} from "firebase/database";
import Swal from "sweetalert2";

function DonateFood() {
  const [userId, setUserId] = useState(null);
  const [foodType, setFoodType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [handleDelivery, setHandleDelivery] = useState(false);
  const [errors, setErrors] = useState({});
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Fetch logged-in user ID
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else setUserId(null);
    });
  }, []);
  
  // Auto-detect user location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude);
        setLongitude(longitude);
        setLoadingLocation(false);

        // Convert lat, long to address using OpenStreetMap API
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          setPickupLocation(data.display_name || "Location detected");
        } catch (error) {
          console.error("Error fetching address:", error);
          alert("Failed to fetch address.");
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to fetch location. Please enter manually.");
        setLoadingLocation(false);
      }
    );
  };

  // Function to calculate distance between two lat/lon points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Validate form
  const validateForm = () => {
    let newErrors = {}; // ✅ Use a new object

    if (!foodType) newErrors.foodType = "Food type is required.";
    if (!quantity || quantity <= 0) newErrors.quantity = "Quantity must be greater than zero.";
    if (!pickupLocation.trim()) newErrors.pickupLocation = "Pickup location is required.";
    if (!date) newErrors.date = "Please select a valid date.";
    if (!time) newErrors.time = "Please select a valid time.";

    // Convert time to 24-hour format before validation
    const formattedTime = convertTo24Hour(time);
    const selectedDateTime = new Date(`${date}T${formattedTime}`);
    const currentTime = new Date();
    const timeDifference = Math.floor((selectedDateTime - currentTime) / (1000 * 60)); // Difference in minutes

    if (selectedDateTime <= currentTime) {
      newErrors.time = "Time must be in the future.";
    } else if (timeDifference < 30) {
      newErrors.time = "Expiry time must be at least 30 minutes ahead.";
    }

    setErrors((prevErrors) => ({ ...prevErrors, ...newErrors })); // ✅ Merge with previous errors
    return Object.keys(newErrors).length === 0;
};
  

  useEffect(() => {
    if (foodType === "Tiffin" || foodType === "CookedMeals") {
      setDate(new Date().toISOString().split("T")[0]); // Auto-set today's date
    }
  }, [foodType]);

  const fetchNearbyUsers = async () => {
    if (!latitude || !longitude) return [];
  
    const nearbyUsers = [];
  
    // Fetch recipients
    const recipientQuery = query(ref(database, "recipient"), orderByChild("role"), equalTo("Recipient"));
    const recipientSnapshot = await get(recipientQuery);
    if (recipientSnapshot.exists()) {
      recipientSnapshot.forEach((child) => {
        const user = child.val();
        const distance = calculateDistance(latitude, longitude, user.lat, user.lon);
        if (distance <= 5) {
          nearbyUsers.push({ id: child.key, ...user, role: "Recipient" });
        }
      });
    }

    // Fetch volunteers
    const volunteerQuery = query(ref(database, "volunteer"), orderByChild("role"), equalTo("Volunteer"));
    const volunteerSnapshot = await get(volunteerQuery);
    if (volunteerSnapshot.exists()) {
      volunteerSnapshot.forEach((child) => {
        const user = child.val();
        const distance = calculateDistance(latitude, longitude, user.lat, user.lon);
        if (distance <= 5) {
          nearbyUsers.push({ id: child.key, ...user, role: "Volunteer" });
        }
      });
    }

    return nearbyUsers;
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!userId) {
    alert("Please log in to donate food.");
    return;
  }

  const result = await Swal.fire({
    title: "Confirm Your Donation",
    html: `<p>You are donating <b>${quantity} kg of ${foodType}</b> at <b>${pickupLocation}</b>.</p>
          <p><b>Expiry Date & Time:</b> ${date} at ${time}</p>
           <p>Are you sure you want to proceed?</p>`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, Donate!",
  });
  if (!result.isConfirmed) return;

  if (!validateForm()) return;

  const donationRef = push(ref(database, "donations"));
  const donationId = donationRef.key;

  // Fetch both recipients & volunteers in one call
  const allNearbyUsers = await fetchNearbyUsers();

  // Separate recipients and volunteers
  const nearbyRecipients = allNearbyUsers.filter(user => user.role === "Recipient");
  const nearbyVolunteers = allNearbyUsers.filter(user => user.role === "Volunteer");

  const donationData = {
    userId,
    foodType,
    quantity,
    pickupLocation,
    latitude,
    longitude,
    message: message.trim(),
    date,
    time,
    status: "Pending",
    acceptedBy: null,
    handleDelivery,
    createdAt: serverTimestamp(),
    recipients: nearbyRecipients.length > 0
    ? Object.fromEntries(nearbyRecipients.map(recipient => [recipient.id, { status: "Pending" }]))
    : null,
    ...(foodType !== "Grocery" && {
      volunteers:
        nearbyVolunteers.length > 0
          ? Object.fromEntries(
              nearbyVolunteers.map(volunteer => [volunteer.id, { status: "Pending" }])
            )
          : null,
          notified30min: false,
          notified15min: false,
        }),
  };

  try {
    await set(donationRef, donationData);
    
    Swal.fire({
      title: "🎉 Donation Completed!",
      text: "Your food donation has been successfully submitted. Thank you for your kindness! 💖",
      icon: "success",
      confirmButtonText: "Great!",
      timer: 4000,
      showConfirmButton: false,
      position: "center",
      backdrop: `
        rgba(0, 150, 0, 0.3)
        center/cover no-repeat
      `,
      customClass: {
        popup: "swal-wide",
      },
    });

    const notifyUsers = async (users, role) => {
      users.forEach(async (user) => {
        const notificationData = {
          donationId,
          type:"donation",
          message: `New donation available: ${foodType}, ${quantity} kg at ${pickupLocation}`,
          read: false,
          createdAt: Date.now(),
        };
        await push(ref(database, `notifications/${role}s/${user.id}`), notificationData);
      });
    };

    await notifyUsers(nearbyRecipients, "recipient");
    //await notifyUsers(nearbyVolunteers, "volunteer");

    // Clear form
    setFoodType("");
    setQuantity("");
    setPickupLocation("");
    setLatitude(null);
    setLongitude(null);
    setMessage("");
    setDate("");
    setTime("");
    setHandleDelivery(false);
    setErrors({});
  } catch (error) {
    console.error("Error submitting donation:", error);
    alert("Failed to submit donation.");
  }
};
const convertTo12Hour = (time) => {
  if (!time) return "";
  let [hour, minute] = time.split(":");
  let ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12; // Convert 24-hour to 12-hour format
  return `${hour}:${minute} ${ampm}`;
};

const convertTo24Hour = (time12h) => {
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":");

  if (modifier === "PM" && hours !== "12") {
    hours = parseInt(hours, 10) + 12;
  }
  if (modifier === "AM" && hours === "12") {
    hours = "00";
  }

  return `${hours}:${minutes}`;
};

  return (
    <div className="my-10">
      <h2 className="text-3xl text-center font-bold mb-7 text-[#DE3163]">
        Donate Food
      </h2>
      <div className="bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-xl w-96 transition-all transform hover:shadow-2xl">
          <form onSubmit={handleSubmit}>
            {/* Food Type */}
            <select
              value={foodType}
              onChange={(e) => setFoodType(e.target.value)}
              className="mb-4 block w-full px-4 py-3 border-1 rounded-lg"
              required
            >
              <option value="">Select Food Type</option>
              <option value="CookedMeals">Cooked Meals</option>
              <option value="Rawfood">Raw Food</option>
              <option value="Tiffin">Tiffin</option>
            </select>
            {errors.foodType && <p className="text-red-500">{errors.foodType}</p>}
  
            {/* Quantity */}
            <input
              type="number"
              min="1"
              placeholder="Quantity (in kg)"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || "")}
              className="mb-4 block w-full px-4 py-3 border-1 rounded-lg"
              required
            />
            {errors.quantity && <p className="text-red-500">{errors.quantity}</p>}
  
            {/* Pickup Location */}
            <div className="relative">
              <input
                type="text"
                placeholder="Pickup Location"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="mb-4 block w-full px-4 py-3 border-1 rounded-lg"
                readOnly
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1 px-3 py-2 bg-blue-500 text-white rounded-lg"
                onClick={getUserLocation}
                disabled={loadingLocation}
              >
                {loadingLocation ? "Detecting..." : "Auto Detect"}
              </button>
            </div>
            {errors.pickupLocation && <p className="text-red-500">{errors.pickupLocation}</p>}
  
            {/* Date & Time */}
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              max={
                foodType && (foodType === "Tiffin" || foodType === "CookedMeals")
                  ? new Date().toISOString().split("T")[0] // Max = Today itself
                  : ""
              }
              onChange={(e) => setDate(e.target.value)}
              className="mb-4 block w-full px-4 py-3 border-1 rounded-lg"
              required
            />
            {errors.date && <p className="text-red-500">{errors.date}</p>}
  
            {/* Expiry Time */}
            <label className="font-bold pl-3">Expiry Time:</label>
<input
  type="time"
  value={time ? convertTo24Hour(time) : ""}
  min={
    date === new Date().toISOString().split("T")[0]
      ? new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
      : ""
  }
  onChange={(e) => {
    setTime(convertTo12Hour(e.target.value));
  }}
  className="mb-4 mt-2 block w-full px-4 py-3 border-1 rounded-lg"
  required
/>

{errors.time && <p className="text-red-500">{errors.time}</p>}

  
            {/* Message */}
            <textarea
              placeholder="Message / Donation Details"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="4"
              className="mb-4 block w-full px-4 py-3 border-1 rounded-lg"
            ></textarea>
  
            {/* Delivery Handling */}
            <label className="flex items-center gap-2 space-x-2 mb-3">
            <input
    type="checkbox"
    checked={handleDelivery}
    onChange={() => {
      if (!handleDelivery) {
        Swal.fire({
          title: "🚚 Confirm Delivery?",
          text: "Are you sure you will handle the delivery?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, I will!",
          cancelButtonText: "No, cancel!",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) {
            setHandleDelivery(true);
          }
        });
      } else {
        setHandleDelivery(false);
      }
    }}
    className="w-4 h-4 cursor-pointer"
  />
            <span className="cursor-pointer">I will handle delivery</span>
          </label>
  
            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 px-4 font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all ease-in-out duration-300"
            >
              Donate Food
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}  

export default DonateFood;