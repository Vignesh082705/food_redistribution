import { useEffect, useState ,useRef} from "react";
import { database, auth } from "../../firebase";
import { ref, onValue, update, get,set,push } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import Modal from "react-modal";
import { useLocation } from "react-router-dom";
import RequestMap from "./RequestMap";
import Swal from "sweetalert2";

Modal.setAppElement("#root");

const Requests = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const highlightId = queryParams.get("highlight");
  const highlightRef = useRef({});
  const [fadedHighlight, setFadedHighlight] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    if (highlightId) {
      const element = highlightRef.current[String(highlightId)];
  
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

  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    reject(error.message || "Location permission denied.");
                }
            );
        } else {
            reject("Geolocation is not supported by this browser.");
        }
    });
};

  useEffect(() => {
    if (modalIsOpen) {
      document.body.style.overflow = "hidden"; // 🔹 Prevent scrolling
    } else {
      document.body.style.overflow = "auto"; // 🔹 Enable scrolling when modal closes
    }
  }, [modalIsOpen]);
  
  // ✅ Get the logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Fetch food requests (Pending) from Realtime Database
  useEffect(() => {
    if (!currentUser) return;
  
    const requestsRef = ref(database, "requests");
  
    const unsubscribe = onValue(requestsRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let pendingRequests = Object.entries(data)
          .map(([id, req]) => ({ id, ...req }))
          .filter((req) => req.status); // Filter by status presence
  
        const updatedRequests = await Promise.all(
          pendingRequests.map(async (req) => {
            if (!req.userId) return { ...req, recipient: null };
  
            const userRef = ref(database, `recipient/${req.userId}`);
            const userSnapshot = await get(userRef);
  
            return userSnapshot.exists()
              ? { ...req, recipient: userSnapshot.val() }
              : { ...req, recipient: null };
          })
        );
  
        const finalRequests = updatedRequests.filter((req) => {
          if (req.donors && req.donors[currentUser.uid] && req.donors[currentUser.uid].status === "Accepted") {
            return true;
          }
          return !req.donors || !Object.values(req.donors).some((donor) => donor.status === "Accepted");
        });
  
        // ✅ Sort by date (descending: latest first)
        finalRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
        setRequests(finalRequests);
      } else {
        setRequests([]);
      }
    });
  
    return () => unsubscribe();
  }, [currentUser]);    

  const handleUpdateStatus = async (requestId, newStatus, recipientId, donorId) => {
    const confirmation = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to ${newStatus} the request?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    });
  
    // If the user confirmed the action
    if (confirmation.isConfirmed) {
    const requestRef = ref(database, `requests/${requestId}`);
    const donorRef = ref(database, `requests/${requestId}/donors`);
    const recipientNotificationRef = ref(database, `notifications/recipients/${recipientId}`);
  
    let locationData = {};
    if (newStatus === "Accepted") {
      try {
        locationData = await getUserLocation();
      } catch (error) {
        console.error("Failed to get location:", error);
      }
    }
  
    try {
      // 🟢 Step 1: Get all donors for the request
      const donorSnapshots = await get(donorRef);
      if (!donorSnapshots.exists()) {
        console.error("No donors found for the request.");
        return;
      }
  
      const donorData = donorSnapshots.val();
      const updates = {};
  
      // 🟠 Step 2: Loop through all donors
      Object.entries(donorData).forEach(([id, donor]) => {
        if (id === donorId) {
          // 👉 Current donor who accepted
          updates[id] = {
            ...donor,
            status: newStatus,
            location: locationData,
          };
        } else {
          // ❌ Reject others
          updates[id] = {
            ...donor,
            status: "Rejected",
          };
        }
      });
  
      // 🟣 Step 3: Update all donor statuses
      await update(donorRef, updates);
  
      // 🔵 Step 4: Update request status to "In Progress"
      if (newStatus === "Accepted") {
        await update(requestRef, {
          status: "In Progress",
          acceptedby:auth.currentUser.uid,
        });
      }
  
      // 🟡 Step 5: Send notification to recipient
      const donorSnapshot = await get(ref(database, `donor/${donorId}`));
      const donorUsername = donorSnapshot.exists() ? donorSnapshot.val().username : 'Unknown Donor';
  
      const recipientNotification = {
        requestId:requestId,
        type:"request",
        message: `Your request has been accepted by "${donorUsername}".`,
        read: false,
        createdAt: Date.now(),
      };
  
      await set(push(recipientNotificationRef), recipientNotification);
      for (const [id, donor] of Object.entries(donorData)) {
        if (id !== donorId) {
          const donorNotificationRef = ref(database, `notifications/donors/${id}`);
          const notification = {
            requestId,
            type: "request",
            message: `Another donor has accepted the request you offered help for.`,
            read: false,
            createdAt: Date.now(),
          };
          await set(push(donorNotificationRef), notification);
        }
      }  
      await Swal.fire({
        title: `${newStatus} Completed`,
        text: `The donor has successfully ${newStatus.toLowerCase()} the request.`,
        icon: 'success',
        confirmButtonText: 'OK',
      });

      console.log(`${newStatus} completed. Notification sent.`);
    } catch (error) {
      console.error("Error updating status:", error);
      await Swal.fire({
        title: 'Error',
        text: 'There was an error updating the status.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  } else {
    // If the user cancels the action
    console.log(`Action ${newStatus} was canceled.`);
  }
};    

const handlePickup = async (id) => {
  const requestRef = ref(database, `requests/${id}`);

  try {
    // ✅ Confirmation before pickup
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Recipient will picked up the food?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Picked Up",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return; // ❌ User cancelled

    const snapshot = await get(requestRef);
    if (!snapshot.exists()) {
      Swal.fire("Error", "Request not found!", "error");
      return;
    }

    const requestData = snapshot.val();
    const recipientId = requestData.userId;

    // 🔄 Update status
    await update(requestRef, { status: "Picked Up" });

    // 📢 Notify recipient
    if (recipientId) {
      const recipientNotificationRef = push(ref(database, `notifications/recipients/${recipientId}`));
      await set(recipientNotificationRef, {
        requestId: id,
        type: "request",
        read: false,
        message: "If you've picked up the food, complete your request. If food is received, thank the donor.",
        createdAt: Date.now(),
      });

      // 🎉 Success Message
      Swal.fire("Success", "Recipient has been notified to complete the request.", "success");
    }
  } catch (error) {
    console.error("Error updating status:", error);
    Swal.fire("Error", "An error occurred while updating the request.", "error");
  }
};
  
   // ✅ Open Map Popup
   const openModal = (req) => {
    if (
      req?.deliveryOption &&
      req?.deliverylocation?.lat &&
      req?.deliverylocation?.lon
    ) {
      // Flatten lat/lon into latitude/longitude to match RequestMap expectations
      req.latitude = req.deliverylocation.lat;
      req.longitude = req.deliverylocation.lon;
    }
  
    setSelectedRequest(req);
    setModalIsOpen(true);
  };
  

  // ✅ Close Map Popup
  const closeModal = () => {
    setSelectedRequest(null);
    setModalIsOpen(false);
  };

  const getNearbyVolunteers = async (recipientLocation) => {
    const R = 6371; // Earth's radius in km
  
    // Function to calculate distance between two coordinates
    const getDistance = (lat1, lon1, lat2, lon2) => {
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in km
    };
  
    // Fetch all volunteers from Firebase
    const volunteerSnapshot = await get(ref(database, "volunteer"));
    if (!volunteerSnapshot.exists()) {
      console.log("No volunteers found in Firebase!");
      return [];
    }
  
    const volunteers = volunteerSnapshot.val();
    const nearbyVolunteers = [];
  
    Object.keys(volunteers).forEach((volunteerId) => {
      const volunteer = volunteers[volunteerId];
      if (volunteer.lat && volunteer.lon) {
        const distance = getDistance(
          recipientLocation.lat,
          recipientLocation.lon,
          volunteer.lat,
          volunteer.lon
        );
  
        if (distance <= 5) {
          nearbyVolunteers.push({ volunteerId, distance });
        }
      }
    });
  
    return nearbyVolunteers;
  };
  
  const VolunteerRequest = async (requestId, recipientId) => {
    try {
      // 1. Get recipient location
      const recipientSnapshot = await get(ref(database, `recipient/${recipientId}`));
      if (!recipientSnapshot.exists()) {
        alert("Recipient data not found.");
        return;
      }
  
      const recipientData = recipientSnapshot.val();
      const recipientLocation = { lat: recipientData.lat, lon: recipientData.lon };
  
      // 2. Get nearby volunteers
      const nearbyVolunteers = await getNearbyVolunteers(recipientLocation);
  
      if (nearbyVolunteers.length === 0) {
        Swal.fire('No Volunteers', 'No nearby volunteers found.', 'info');
        return;
      }
  
      await Swal.fire({
        title: 'Assign Volunteers',
        text: 'Do you want to assign nearby volunteers for delivery assistance?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Assign Volunteers',
        cancelButtonText: 'No, Cancel',
      }).then(async (result) => {
        if (result.isConfirmed) {
      const requestRef = ref(database, `requests/${requestId}`);
      const updates = {};
  
      // 3. Loop through all nearby volunteers
      for (const volunteer of nearbyVolunteers) {
        const volunteerId = volunteer.volunteerId;
  
        // a) Add them to request with status "Pending"
        updates[`volunteers/${volunteerId}`] = {
          status: "Pending",
        };
  
        // b) Send notification
        await push(ref(database, `notifications/volunteers/${volunteerId}`), {
          message: "A donor has accepted the food request but can't deliver it. Can you help deliver the food?",
          requestId:requestId,
          type:"request",
          createdAt: Date.now(),
          read: false,
        });
      }
  
      // 4. Update request node once for all volunteers
      updates.status = "Volunteer Assigned";
      await update(requestRef, updates);
  
      // 5. Notify recipient
      await push(ref(database, `notifications/recipients/${recipientId}`), {
        message: "Volunteers have been requested to help with your delivery.",
        requestId:requestId,
        type:"request",
        createdAt: Date.now(),
        read: false,
      });
  
      Swal.fire('Success', 'Nearby volunteers requested successfully!', 'success');
        }
      });
    } catch (error) {
      console.error("Error handling volunteer request:", error);
      Swal.fire('Error', 'Failed to assign volunteers.', 'error');
    }
  };   
  
  const donorDelivery = async (requestId, recipientId) => {
    try {
      await Swal.fire({
        title: 'Confirm Delivery',
        text: 'Are you sure you want to notify the recipient that the donor is on the way?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Notify!',
        cancelButtonText: 'No, Cancel',
      }).then(async (result) => {
        if (result.isConfirmed) {
      const recipientNotificationRef = ref(database, `notifications/recipients/${recipientId}`);
      await push(recipientNotificationRef, {
        requestId:requestId,
        type:"request",
        message: "The donor is on the way to deliver your food!",
        createdAt: Date.now(),
        read: false,
      });
  
      const requestRef = ref(database, `requests/${requestId}`);
      await update(requestRef, {
        status: "On the Way",
      });
  
      Swal.fire('Success', 'Recipient has been notified that the donor is on the way!', 'success');
        }
      });
    } catch (error) {
      console.error("Error notifying recipient:", error);
      Swal.fire('Error', 'Failed to notify recipient.', 'error');
    }
  };
  const delivered = async (requestId, recipientId) => {
    try {
      await Swal.fire({
        title: 'Confirm Delivery',
        text: 'Is the food delivered to the recipient?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Delivered',
        cancelButtonText: 'No, Cancel',
      }).then(async (result) => {
        if (result.isConfirmed) {
      const recipientNotificationRef = ref(database, `notifications/recipients/${recipientId}`);
      await push(recipientNotificationRef, {
        requestId:requestId,
        message: "The Food is delivered by the donor.If you recieved please make sure to click the recieved button",
        type:"request",
        createdAt: Date.now(),
        read: false,
      });
  
      const requestRef = ref(database, `requests/${requestId}`);
      await update(requestRef, {
        status: "Delivered",
      });
  
      Swal.fire('Success', 'Recipient has been notified that the food is delivered!', 'success');
        }
      });
    } catch (error) {
      console.error("Error notifying recipient:", error);
      Swal.fire('Error', 'Failed to notify recipient.', 'error');
    }
  };

  return (
    <div className="container mx-auto p-5">
      <h2 className="text-3xl text-center font-bold mb-7 text-[#DE3163]">Incoming Food Requests</h2>
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
        <label className="font-bold mr-2">Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="On the Way">On the Way</option>
          <option value="Delivered">Delivered</option>
          <option value="Volunteer Assigned">Volunteer Assigned</option>
          <option value="Picked Up">Picked Up</option>
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
      {requests.length === 0 ? (
        <p>No new requests.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests
          .filter((req) => {
            const matchesStatus = !statusFilter || req.status === statusFilter;
            const matchesDate = !dateFilter || req.date === dateFilter;
            return matchesStatus && matchesDate;
          })
          .map((req) => (
              <div
                key={req.id}
                className={`p-4 border rounded shadow-lg bg-white flex flex-col justify-between ${
                  req.id === fadedHighlight ? "bg-yellow-100 border-l-4 border-yellow-500" : "bg-white"
                }`}                
              >
              <h3 className="text-xl font-semibold">{req.foodType} - {req.quantity} portions</h3>
              <p>📅 Date: {req.date} | ⏰ Time: {req.time}</p>
              <p>⚠️ Urgency: <span className="font-bold">{req.urgency}</span></p>
              <p>📝 Message: "{req.message}"</p>

              {/* ✅ Recipient Details */}
              {req.recipient ? (
                <div className="mt-2 p-2 border rounded bg-gray-100">
                  <h4 className="font-semibold">Requested by:</h4>

                  {/* 🔹 Check if recipient is a Charity or Individual */}
                  {req.recipient.charityName ? (
                    <>
                      <p>🏛 Charity Name: {req.recipient.charityName}</p>
                      <p>🆔 Reg No: {req.recipient.charityRegNo || "N/A"}</p>
                    </>
                  ) : (
                    <p>👤 Name: {req.recipient.name || "Unknown"}</p>
                  )}

                  <p>📞 Phone: 
                    <a href={`tel:${req.recipient.contact}`} className="text-blue-600">
                      {req.recipient.contact || "N/A"}
                    </a>
                  </p>
                  <p>📍 Address: {req.recipient.address || "Not provided"}</p>
                  <p>🏙 City: {req.recipient.city}, {req.recipient.district}</p>
                </div>
              ) : (
                <p className="text-red-500 mt-2">Recipient details not found.</p>
              )}
              <p className="font-bold mt-2">
                Status:{" "}
                <span className="text-blue-600">
                  {req.donors && req.donors[currentUser.uid]?.status === "Rejected"
                    ? "Rejected"
                    : req.status}
                </span>
              </p>
              {/* ✅ Accept/Reject Buttons */}
              <div className="mt-3 flex gap-2">
              {req.status === "Pending" && 
                (!req.donors || req.donors[currentUser.uid]?.status !== "Rejected") && (
                  <div>
                    <button 
                      className="bg-green-500 text-white px-3 rounded py-2 ml-5 mr-4"
                      onClick={() => handleUpdateStatus(req.id, "Accepted", req.userId, currentUser.uid)}
                    >
                      Accept
                    </button>
                    <button 
                      className="bg-red-500 text-white px-3 rounded py-2"
                      onClick={() => handleUpdateStatus(req.id, "Rejected", req.userId, currentUser.uid)}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {req.status === "Ready for Pickup" && req.deliveryOption === false && (
                    <button 
                      onClick={() => handlePickup(req.id, req.userId, req.deliveryOption)} 
                      className="bg-green-500 text-white px-3 rounded py-2"
                    >
                      Food Picked Up
                    </button>
                )}
                {req.status === "In Progress" && req.deliveryOption === true && (
                    <button 
                      onClick={() => donorDelivery(req.id, req.userId)} 
                      className="bg-green-500 text-white px-3 rounded py-2"
                    >
                      I'm on the way
                    </button>
                )}
                {req.status === "In Progress" && req.deliveryOption === true && (
                    <button 
                      onClick={() => VolunteerRequest(req.id, req.userId)} 
                      className="bg-green-500 text-white px-3 rounded py-2"
                    >
                      volunteer Request
                    </button>
                )}
                {req.status === "On the Way" && req.deliveryOption === true && (
                    <button 
                      onClick={() => delivered(req.id, req.userId)} 
                      className="bg-green-500 text-white px-3 rounded py-2 "
                    >
                      Delivered
                    </button>
                )}
                {(req.status === "In Progress"||req.status ==="On the Way" ) && req.deliveryOption === true && (
                  <>
                <button 
                  className="bg-blue-500 text-white px-3  rounded py-2 "
                  onClick={() => openModal(req)}
                >
                  View on Map
                </button>
                </>
              )}
              </div>
            </div>
          ))}
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
            {selectedRequest && <RequestMap request={selectedRequest} />}
          </Modal>
        </div>
      )}
    </div>
  );
};

export default Requests;
