import React, { useState, useEffect,useRef } from "react";
import { useLocation } from "react-router-dom";
import { database,ref,get,set, onValue,update, push, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getDatabase } from "firebase/database";
import Modal from "react-modal";
import DonorMap from "./DonorMap";
import Swal from "sweetalert2";

Modal.setAppElement("#root");
function FindFood() {
  const [donations, setDonations] = useState([]);
  const [userId, setUserId] = useState(null);
  const[selectedDonor,setSelectedDonor]=useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const highlightId = queryParams.get("highlight");
  const [fadedHighlight, setFadedHighlight] = useState(null);
  const donationRefs = useRef({});
  const [donors, setDonors] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    if (highlightId) {
      const element = donationRefs.current[String(highlightId)];
  
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  
      setFadedHighlight(highlightId);
  
      const timer = setTimeout(() => {
        setFadedHighlight(null);
      }, 3000); // Highlight stays for 3s
  
      return () => clearTimeout(timer);
    }
  }, [highlightId]);

  useEffect(() => {
    const db = getDatabase();
    const donorRef = ref(db, "donor");
  
    onValue(donorRef, (snapshot) => {
      if (snapshot.exists()) {
        setDonors(snapshot.val());
      }
    });
  }, []);

  
  useEffect(() => {
    if (modalIsOpen) {
      document.body.style.overflow = "hidden"; // 🔹 Prevent scrolling
    } else {
      document.body.style.overflow = "auto"; // 🔹 Enable scrolling when modal closes
    }
  }, [modalIsOpen]);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else setUserId(null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
  
    const recipientRef = ref(database, `recipient/${userId}`);
    const unsubscribeRecipient = onValue(recipientRef, (snapshot) => {
      const recipientData = snapshot.val();
      if (recipientData) {
        const storedLat = recipientData.lat;
        const storedLon = recipientData.lon;
  
        const donationsRef = ref(database, "donations");
        const unsubscribeDonations = onValue(donationsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const donationsList = Object.keys(data).map((key) => ({
              id: key,
              ...data[key],
            }));
  
            const updatedDonations = donationsList
              .filter((donation) => {
                const distance = getDistance(storedLat, storedLon, donation.latitude, donation.longitude);
                const donationStatus = donation?.status?.toLowerCase();
                const isCompleted = donationStatus === "completed";

                const recipientStatus = donation?.recipients?.[userId]?.status;
                const isAcceptedByThisRecipient = recipientStatus === "Accepted";

                const isAcceptedByAnotherRecipient = Object.entries(donation?.recipients || {}).some(
                  ([id, val]) => id !== userId && val?.status === "Accepted"
                );

                const isAcceptedByVolunteer = Object.entries(donation?.volunteers || {}).some(
                  ([id, val]) =>
                    ["Accepted", "Completed", "Picked Up", "Delivered"].includes(val?.status)
                );

                const isDonationVisible =
                  distance <= 5 &&
                  !isAcceptedByVolunteer &&
                  (!isAcceptedByAnotherRecipient || isAcceptedByThisRecipient);

                return isDonationVisible;
              })
              .sort((a, b) => b.createdAt - a.createdAt); // 📌 Sort latest first
  
            setDonations(updatedDonations);
          }
        });
  
        // ✅ Return unsubscribe for donations
        return () => unsubscribeDonations();
      }
    });
  
    // ✅ Return unsubscribe for recipient
    return () => unsubscribeRecipient();
  }, [userId]);
   
  
  // 🔥 Function to Calculate Distance Between Two Locations
  function getDistance(lat1, lon1, lat2, lon2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth’s radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  const requestVolunteerHelp = async (donationId, recipientId) => {
  const db = getDatabase();

  try {
    // 🔹 Step 1: Get donation details
    const donationSnapshot = await get(ref(db, `donations/${donationId}`));
    if (!donationSnapshot.exists()) {
      Swal.fire("Oops!", "Donation not found!", "error");
      return;
    }
    const donationData = donationSnapshot.val();
    const donorId = donationData.userId;
    const donorLat = donationData.latitude;
    const donorLng = donationData.longitude;

    if (!donorLat || !donorLng) {
      Swal.fire("Oops!", "Donor location not available!", "error");
      return;
    }

    // 🔹 Step 2: Check for nearby volunteers FIRST
    const volunteersSnapshot = await get(ref(db, "volunteer"));
    let nearbyVolunteers = [];

    if (volunteersSnapshot.exists()) {
      volunteersSnapshot.forEach((childSnapshot) => {
        const volunteerData = childSnapshot.val();
        if (volunteerData.lat && volunteerData.lon) {
          const distance = getDistance(donorLat, donorLng, volunteerData.lat, volunteerData.lon);
          if (distance <= 5) {
            nearbyVolunteers.push({
              id: childSnapshot.key,
              ...volunteerData,
            });
          }
        }
      });
    }

    if (nearbyVolunteers.length === 0) {
      Swal.fire("No Nearby Volunteers", "No volunteers available within 5 km radius.", "info");
      return;
    }

    // 🔹 Step 3: Confirm with Recipient
    const confirmResult = await Swal.fire({
      title: "Request Volunteer Help?",
      text: "Nearby volunteers found. Do you want to request help?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, request help",
      cancelButtonText: "Cancel",
    });

    if (!confirmResult.isConfirmed) {
      console.log("❌ Volunteer request canceled by user.");
      return;
    }

    // 🔹 Step 4: Get Recipient Details
    const recipientSnapshot = await get(ref(db, `recipient/${recipientId}`));
    const recipientData = recipientSnapshot.val();

    // 🔹 Step 5: Update donation with recipient
    const updates = {
      status: "Accepted",
      recipientId,
      [`recipients/${recipientId}/status`]: "Accepted",
      [`recipients/${recipientId}/location`]: {
        latitude: recipientData.lat,
        longitude: recipientData.lon,
      },
    };

    let affectedRecipients = {};
    Object.keys(donationData.recipients).forEach((otherRecipientId) => {
      if (otherRecipientId !== recipientId) {
        updates[`recipients/${otherRecipientId}`] = "Not Available";
        affectedRecipients[otherRecipientId] = "Not Available";
      }
    });

    await update(ref(db, `donations/${donationId}`), updates);
    notifyOtherRecipients(donationId, affectedRecipients);

    // 🔹 Step 6: Notify Donor & Recipient
    await push(ref(db, `notifications/donors/${donorId}`), {
      message: "A recipient has accepted your food donation! A volunteer will pick it up soon.",
      donationId,
      type: "donation",
      createdAt: Date.now(),
      read: false,
    });

    await push(ref(db, `notifications/recipients/${recipientId}`), {
      message: "Your request has been accepted. Volunteers have been notified!",
      donationId,
      type: "donation",
      createdAt: Date.now(),
      read: false,
    });

    // 🔹 Step 7: Notify Volunteers
    nearbyVolunteers.forEach((volunteer) => {
      set(ref(db, `donations/${donationId}/pickupRequests/${volunteer.id}`), {
        status: "Pending",
      });

      push(ref(db, `notifications/volunteers/${volunteer.id}`), {
        type: "donation",
        message: `A recipient near you needs help with delivery. Click to accept.`,
        donationId,
        createdAt: Date.now(),
        read: false,
      });
    });

    await update(ref(db, `donations/${donationId}`), { status: "Volunteer Assigned" });

    await Swal.fire({
      title: "Volunteers Notified!",
      text: "Nearby volunteers have been notified successfully. You will be updated soon.",
      icon: "success",
      confirmButtonText: "OK",
    });

  } catch (error) {
    console.error("Error requesting volunteer help:", error);
    Swal.fire("Error", "Something went wrong while requesting volunteer help.", "error");
  }
};

const handleMarkAsReceived = async (donationId, donorId, donationData) => {
  try {
    const db = database;

    const confirmResult = await Swal.fire({
      title: "Mark as Received?",
      text: "Are you sure you have received the food donation?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, I have received it",
      cancelButtonText: "Cancel",
    });

    if (!confirmResult.isConfirmed) {
      console.log("❌ Mark as received cancelled by user.");
      return;
    }
    // 1️⃣ Mark donation as completed
    const donationRef = ref(db, `donations/${donationId}`);
    await update(donationRef, { status: "Completed" });

    // 2️⃣ Notify the donor
    const donorNotificationRef = ref(db, `notifications/donors/${donorId}`);
    await push(donorNotificationRef, {
      donationId,
      type:"donation",
      message: "The recipient has received the food. Thank you for your donation! ❤️",
      read: false,
      createdAt: Date.now(),
    });

    // 3️⃣ Notify completed volunteers
    const pickupRequests = donationData?.pickupRequests || {};
    const involvedVolunteers = [];

    for (let volunteerId in pickupRequests) {
      const request = pickupRequests[volunteerId];
      if (request?.status === "Completed") {
        involvedVolunteers.push(volunteerId); // 🧠 store involved volunteers

        const volunteerNotificationRef = ref(db, `notifications/volunteers/${volunteerId}`);
        await push(volunteerNotificationRef, {
          donationId,
          type:"donation",
          message: "The recipient has received the food. Thank you for your help! 🙏",
          read: false,
          createdAt: Date.now(),
        });
      }
    }

    // 4️⃣ Update donor stats
    const donorRef = ref(db, `donor/${donorId}`);
    const donorSnap = await get(donorRef);
    const donorData = donorSnap.val();
    const currentCount = donorData?.donationCount || 0;
    const currentValue = donorData?.donationValue || 0;
    const newValue = donationData?.quantity || 0;

    await update(donorRef, {
      donationCount: currentCount + 1,
      donationValue: currentValue + newValue,
    });

    // 5️⃣ Update recipient stats
    const recipientId = auth.currentUser?.uid;
    if (recipientId) {
      const recipientRef = ref(db, `recipient/${recipientId}`);
      const recipientSnap = await get(recipientRef);
      const recipientData = recipientSnap.val();
      const receivedCount = recipientData?.donationsReceived || 0;

      await update(recipientRef, {
        donationsReceived: receivedCount + 1,
      });
    }

    // 6️⃣ Create Feedback Record for All Involved
    const feedbackRef = ref(db, `donation_feedback/${donationId}`);
    const feedbackData = {
      [donorId]: {
        feedback: "",
        rating: null,
        status: "pending",
      },
      [recipientId]: {
        feedback: "",
        rating: null,
        status: "pending",
      },
    };

    involvedVolunteers.forEach(volunteerId => {
      feedbackData[volunteerId] = {
        feedback: "",
        rating: null,
        status: "pending",
      };
    });

    await set(feedbackRef, feedbackData);

    await Swal.fire({
      title: "Success!",
      text: "Donation marked as Completed. Notifications sent and feedback process started.",
      icon: "success",
      confirmButtonText: "Done",
    });
    console.log("✅ Donation marked as received, notifications sent, feedback prepared!");
  } catch (error) {
    console.error("❌ Error marking donation as received:", error);
    Swal.fire("Oops!", "Something went wrong. Please try again.", "error");
  }
};
  

  const acceptDonation = async (donationId, recipientId, donorId) => {
    const donationRef = ref(database, `donations/${donationId}`);
    const recipientSnapshot = await get(ref(database, `recipient/${recipientId}`));
    const recipientData = recipientSnapshot.val();

  
    try {
      // 🔥 Step 1: Fetch the latest donation data
      const snapshot = await get(donationRef);
      if (!snapshot.exists()) {
        await Swal.fire({
          title: "Donation Not Found",
          text: "Sorry, the donation you're trying to access no longer exists.",
          icon: "error",
          confirmButtonText: "OK",
        });
        return;
      }
  
      const donationData = snapshot.val();
      console.log("📌 Donation Data:", donationData);
  
      const result = await Swal.fire({
        title: 'Are you sure you want to accept this donation?',
        text: `You are about to accept the donation for ${donationData.foodType}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, accept it!',
        cancelButtonText: 'Cancel',
      });

      if (result.isConfirmed) {
      // 🔥 Step 2: Update donation status and accepted recipient
      const updates = {
        status: "Accepted", // ✅ Store status separately
        recipientId,  // ✅ Store recipient ID
        [`recipients/${recipientId}/status`]: "Accepted", // ✅ Store recipient status inside recipients
        [`recipients/${recipientId}/location`]: {  
          latitude: recipientData.lat,  // ✅ Store recipient's latitude
          longitude: recipientData.lon  // ✅ Store recipient's longitude
      }
    };    
      const affectedRecipients = {};
      // 🔥 Step 3: Mark other recipients as "Not Available"
      Object.keys(donationData.recipients).forEach((otherRecipientId) => {
        if (otherRecipientId !== recipientId) {
          updates[`recipients/${otherRecipientId}`] = "Not Available";
          affectedRecipients[otherRecipientId] = "Not Available";
        }
      });
      if (donationData.volunteers) {
        Object.keys(donationData.volunteers).forEach((volunteerId) => {
          updates[`volunteers/${volunteerId}/status`] = "Not Available";
        });
      }
  
      await update(donationRef, updates);
      console.log("✅ Donation Accepted & Updated!");
  
      // 🔥 Step 4: Notify donor
      await push(ref(database, `notifications/donors/${donorId}`), {
        message: "A recipient has accepted your food donation!",
        donationId,
        type:"donation",
        createdAt: Date.now(),
        read: false,
      });
      console.log("✅ Notification Sent to Donor!");
  
      // 🔥 Step 5: Notify other recipients
      await notifyOtherRecipients(donationId,  affectedRecipients);
      
      await Swal.fire({
        title: 'Request Accepted!',
        text: 'Food request has been accepted successfully!',
        icon: 'success',
        confirmButtonText: 'Okay',
      });
    } 
  }catch (error) {
    await Swal.fire({
      title: "Oops!",
      text: "Something went wrong while accepting the donation. Please try again.",
      icon: "error",
      confirmButtonText: "Okay",
    });
    }
  };  

  const handlePickupRequest = async (donationId, recipientId, donorId) => {
  const result = await Swal.fire({
    title: "Confirm Pickup?",
    text: "Are you sure you want to confirm to pickup it and notify the donor?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, Confirm",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return; // ❌ Exit if cancelled

  try {
    const donationRef = ref(database, `donations/${donationId}`);

    // ✅ Update the donation status to 'On the Way'
    await update(donationRef, {
      status: "On the Way",
      recipientId: recipientId,
    });

    // ✅ Notify the donor
    const notificationRef = ref(database, `notifications/donors/${donorId}`);
    const newNotification = push(notificationRef);
    await update(newNotification, {
      donationId,
      type: "donation",
      message: `The recipient has confirmed pickup for your donation. Recipient is on the way.`,
      createdAt: Date.now(),
      read: false,
    });

    await Swal.fire({
      title: "Pickup Confirmed!",
      text: "The donor has been notified that you're on the way.",
      icon: "success",
      showConfirmButton: false,
      timer: 2500, // Auto close after 2.5 seconds
      timerProgressBar: true,
    });
  } catch (error) {
    console.error("Error handling pickup request:", error);
    await Swal.fire({
      title: "Pickup Failed",
      text: "Something went wrong while confirming the pickup. Please try again.",
      icon: "error",
      confirmButtonText: "Retry",
    });
  }
};
  
  const notifyOtherRecipients = async (donationId, affectedRecipients) => {
    try {
      console.log("🚀 Notifying recipients:", affectedRecipients); // ✅ Debugging
  
      for (const recipientId in affectedRecipients) {
        if (affectedRecipients[recipientId] === "Not Available") {
          console.log("✅ Sending notification to:", recipientId); // ✅ Ensure it's reaching here
  
          // 🔥 Send notification only to recipients marked as "Not Available"
          await push(ref(database, `notifications/recipients/${recipientId}`), {
            donationId,
            type:"donation",
            message: "This food donation is no longer available.",
            createdAt: Date.now(),
            read: false,
          });
        }
      }
      console.log("✅ Notifications sent to affected recipients.");
    } catch (error) {
      console.error("❌ Error notifying other recipients:", error);
    }
  };    
  
  const openModal = (donation) => {
    setSelectedDonor(donation);
    setModalIsOpen(true);
  };

  // ✅ Close Map Popup
  const closeModal = () => {
    setSelectedDonor(null);
    setModalIsOpen(false);
  };
  return (
    <div className="my-10">
      <h2 className="text-3xl text-center font-bold mb-7 text-[#DE3163]">Find Food</h2>
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        <div>
      <label className="font-bold mr-2">Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="Volunteer Assigned">Volunteer Assigned</option>
          <option value="Completed">Completed</option>
        </select>
      </div>
      <div>
      <label className="font-bold mr-2">Filter by Status:</label>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2 border rounded"
        />
        </div>
      </div>
      <div className="flex flex-wrap justify-center">
        {donations.length > 0 ? (
          donations
          .filter((donation) => {
            const matchesStatus = !statusFilter || donation.status === statusFilter;
            const matchesDate = !dateFilter || donation.date === dateFilter;
            return matchesStatus && matchesDate;
          })
          .map((donation) => (        
            <div
            key={donation.id}
            ref={(el) => (donationRefs.current[String(donation.id)] = el)}
            id={`donation-${donation.id}`}
            className={`donation-card w-80 p-5 m-3 rounded-xl shadow-lg transition-colors duration-1000 ${
              donation.id === fadedHighlight
                ? 'bg-yellow-100 border-yellow-400 border-2'
                : 'bg-white'
            }`}
          >                    
              <h3 className="text-xl font-bold">{donation.foodType}</h3>
              <p><strong>Quantity:</strong> {donation.quantity}</p>
              <p><strong>Pickup Location:</strong> {donation.pickupLocation}</p>
              <p><strong>Available Until:</strong> {donation.date} {donation.time}</p>
              <p><strong>Status:</strong> {donation.status}</p>
              {(donation.status !== "Pending" && donation.userId  ) && (
                <div className="mt-3 p-2 bg-gray-50 border rounded">
                  <p><strong>Donor Name:</strong> {donors?.[donation.userId]?.username}</p>
                  <p><strong>Phone:</strong> {donors?.[donation.userId]?.contact}</p>
                </div>
              )}
              {(donation.status !== "Completed" &&
                <p>
                <strong>Delivery Mode:</strong> 
                {donation.handleDelivery ? " Donor will deliver 🚗" : " Recipient must pick up or request volunteer"}
              </p>
              )}
              {donation.handleDelivery && donation.status === "Pending" && (
              <button
                onClick={() => acceptDonation(donation.id,auth.currentUser.uid, donation.userId)}
                className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 block w-full"
              >
                Request Food
              </button>
              )}
              {!donation.handleDelivery && donation.status === "Pending" && (
              <button
                onClick={() => acceptDonation(donation.id,auth.currentUser.uid, donation.userId)}
                className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 block w-full"
              >
                Request Food and Pickup
              </button>
              )}
              {!donation.handleDelivery && donation.status === "Pending" && (
                <button
                  onClick={() => requestVolunteerHelp(donation.id,auth.currentUser.uid)}
                  className="mt-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 block w-full"
                >
                  Request Volunteer Help 🤝
                </button>
              )}
              {!donation.handleDelivery && (donation.status === "Accepted" || donation.status==="Volunteer Rejected" )&&(
                <button
                  onClick={() => handlePickupRequest(donation.id,auth.currentUser.uid,donation.userId)}
                  className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 block w-full"
                >
                  🚶On the Way 
                </button>
              )}
              {(donation.status === "Ready for Pickup"|| donation.status === "Delivered") && (
            <button
              onClick={() => handleMarkAsReceived(donation.id, donation.userId,donation)}
              className="mt-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 block w-full"
            >
              ✅ Mark as Received
            </button>
          )}
          {(donation.status !== "Completed" &&(
              <button
                onClick={() => openModal(donation)}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 block w-full"
              >
                View on Map 📍
              </button>
          )
          )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No food donations available at the moment.</p>
        )}
      </div>
      <Modal
            isOpen={modalIsOpen}
            contentLabel="Request Location"
            className="bg-white p-5 rounded-lg shadow-xl w-4/5 mx-auto mt-20"
            overlayClassName="fixed inset-0 bg-opacity-30 backdrop-blur-md flex items-center justify-center"
          >
            <div className="relative w-full">
              <button 
                onClick={closeModal} 
                className="absolute  -top-1 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-lg"
              >
                ✖
              </button>
            </div>
            {selectedDonor && <DonorMap donor={selectedDonor} />}
          </Modal>
    </div>
  );
}

export default FindFood;