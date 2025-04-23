import React, { useState, useEffect, useRef} from "react";
import { getDatabase, ref, get, update, push,onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";
import Swal from "sweetalert2";

const VolunteerTasks = () => {
  const auth = getAuth();
  const [tasks, setTasks] = useState([]);
  const [taskRequests, setTaskRequests] = useState([]);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const highlightId = queryParams.get("highlight");
  const navigate = useNavigate();
  const taskRefs = useRef({});
  const requestRefs = useRef({});
  const [addresses, setAddresses] = useState({});
  const [addressess, setAddressess] = useState({});
  const [addressesss, setAddressesss] = useState({});
  const [filterType, setFilterType] = useState("all"); // all | donation | request
  const [filterStatus, setFilterStatus] = useState("all"); // all | Pending | Accepted | Picked Up
  const [fadedHighlight, setFadedHighlight] = useState(null);
  const [selectedDate, setSelectedDate] = useState(""); // default empty

  
  useEffect(() => {
    const fetchAllAddressess = async () => {
      const newAddressess = {};

      for (const task of taskRequests) {
        const recipient = task.deliverylocation;
        if (recipient) {
          const address = await getAddressFromCoords(recipient.lat,recipient.lon);
          newAddressess[task.id] = address;
        }
      }

      setAddressess(newAddressess);
    };

    if (tasks.length > 0) {
      fetchAllAddressess();
    }
  }, [taskRequests]);

  useEffect(() => {
    const fetchAllAddressesss = async () => {
      const newAddressesss = {};

      for (const task of taskRequests) {
        const donorLocation = task.donors?.[task.acceptedby]?.location;
        if (donorLocation?.latitude && donorLocation?.longitude) {
          const address = await getAddressFromCoords(donorLocation.latitude,donorLocation.longitude);
          newAddressesss[task.id] = address;
        }
      }
      setAddressesss(newAddressesss);
    };
    if (tasks.length > 0) {
      fetchAllAddressesss();
    }
  }, [taskRequests]);

  useEffect(() => {
    const db = getDatabase();
    const donationsRef = ref(db, "donations");
  
    const unsubscribe = onValue(donationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allDonations = snapshot.val();
        let pendingTasks = [];
  
        Object.keys(allDonations).forEach((donationId) => {
          const donation = allDonations[donationId];
          const currentVolunteerStatus = donation.pickupRequests?.[auth.currentUser?.uid];

          if (currentVolunteerStatus?.status === "Rejected") return;

          const anyVolunteerAccepted = Object.values(donation.pickupRequests || {}).some(
            (req) => req?.status === "Accepted"
          );
          const currentVolunteerAccepted = currentVolunteerStatus?.status === "Accepted";
  
          const showToThisVolunteer = !anyVolunteerAccepted || currentVolunteerAccepted;
  
          if (currentVolunteerStatus && showToThisVolunteer) {
            pendingTasks.push({ id: donationId, ...donation });
          }
        });
  
        // ✅ Sort tasks by date descending
        pendingTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setTasks(pendingTasks);
      }
    });
    
    return () => unsubscribe(); // Cleanup listener when component unmounts
  }, []);  
  

  const getAddressFromCoords = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const data = await res.json();
      return data.display_name;
    } catch (error) {
      console.error("Error:", error);
      return "Address not found";
    }
  };

  useEffect(() => {
    const fetchAllAddresses = async () => {
      const newAddresses = {};

      for (const task of tasks) {
        const recipient = task.recipients?.[task.recipientId];
        if (recipient?.location) {
          const { latitude, longitude } = recipient.location;
          const address = await getAddressFromCoords(latitude, longitude);
          newAddresses[task.id] = address;
        }
      }

      setAddresses(newAddresses);
    };

    if (tasks.length > 0) {
      fetchAllAddresses();
    }
  }, [tasks]);

  useEffect(() => {
      if (highlightId) {
        const element = taskRefs.current[String(highlightId)];
    
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


    const markFoodAsPickedUp = async (donationId, volunteerId) => {
      const confirmResult = await Swal.fire({
        title: "Are you sure?",
        text: "Do you want to mark this food as picked up?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, confirm!",
      });
    
      if (!confirmResult.isConfirmed) return; // ❌ Cancel pressed
    
      const db = getDatabase();
      const donationRef = ref(db, `donations/${donationId}`);
    
      try {
        const snapshot = await get(donationRef);
        if (!snapshot.exists()) {
          console.error("❌ Error: Donation not found.");
          return;
        }
    
        const donationData = snapshot.val();
    
        let acceptedRecipientId = null;
        Object.keys(donationData.recipients).forEach((recipientId) => {
          if (donationData.recipients[recipientId].status === "Accepted") {
            acceptedRecipientId = recipientId;
          }
        });
    
        if (!acceptedRecipientId) {
          console.error("❌ No accepted recipient found.");
          return;
        }
    
        // ✅ Update status to "Picked Up"
        await update(donationRef, {
          status: "Picked Up",
        });
    
        await update(ref(db, `donations/${donationId}/pickupRequests/${volunteerId}`), {
          status: "Picked Up",
        });
    
        // 🔔 Notify recipient
        await push(ref(db, `notifications/recipients/${acceptedRecipientId}`), {
          message: "Your food is on the way! A volunteer has picked it up.",
          donationId,
          type: "donation",
          createdAt: Date.now(),
          read: false,
        });
    
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Food pickup confirmed and recipient notified!",
        });
      } catch (error) {
        console.error("❌ Error updating pickup status:", error);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
        });
      }
    };
    
  const acceptTask = async (donationId, volunteerId) => {
    const confirmResult = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to accept this task?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, accept it!",
    });
  
    if (!confirmResult.isConfirmed) return; // ❌ Cancel pressed
  
    const db = getDatabase();
  
    try {
      // 1. Get donation data
      const donationSnapshot = await get(ref(db, `donations/${donationId}`));
      const donationData = donationSnapshot.val();
  
      // 2. Update current volunteer's status
      await update(ref(db, `donations/${donationId}/pickupRequests/${volunteerId}`), {
        status: "Accepted",
      });
  
      // 3. Update donation status
      await update(ref(db, `donations/${donationId}`), {
        acceptedBy: volunteerId,
        status: "In Progress",
      });
  
      // 4. Notify donor
      const donorId = donationData.userId;
      await push(ref(db, `notifications/donors/${donorId}`), {
        message: `A volunteer has accepted the task for your donation.`,
        donationId,
        type: "donation",
        createdAt: Date.now(),
        read: false,
      });
  
      // 5. Notify recipient
      const recipientId = donationData.recipientId;
      await push(ref(db, `notifications/recipients/${recipientId}`), {
        message: `A volunteer has accepted the task for your Request.`,
        donationId,
        type: "donation",
        createdAt: Date.now(),
        read: false,
      });
  
      // 6. Remove other volunteer pickupRequests & notify them
      if (donationData.volunteers) {
        await Promise.all(
          Object.keys(donationData.volunteers).map(async (otherVolunteerId) => {
            if (otherVolunteerId !== volunteerId) {
              await update(ref(db, `donations/${donationId}/pickupRequests`), {
                [otherVolunteerId]: null,
              });
  
              await push(ref(db, `notifications/volunteers/${otherVolunteerId}`), {
                message: `The task has already been accepted by another volunteer.`,
                donationId,
                createdAt: Date.now(),
                read: false,
              });
            }
          })
        );
      }
  
      Swal.fire({
        icon: "success",
        title: "Task Accepted!",
        text: "You have successfully accepted the task.",
      });
    } catch (error) {
      console.error("Error accepting task:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
      });
    }
  };
  

  const foodDelivered = async (donationId, volunteerId) => {
    const confirmResult = await Swal.fire({
      title: "Confirm Delivery",
      text: "Are you sure you want to mark the food as delivered?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Delivered!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#d33",
    });
  
    if (!confirmResult.isConfirmed) return;
  
    const db = getDatabase();
    const donationRef = ref(db, `donations/${donationId}`);
  
    try {
      const snapshot = await get(donationRef);
      if (!snapshot.exists()) {
        console.error("Donation not found");
        return;
      }
  
      const donationData = snapshot.val();
      const donorId = donationData.userId;
      const recipientId = donationData.recipientId;
  
      // ✅ Update status to Delivered
      await update(donationRef, {
        status: "Delivered",
      });
  
      await update(ref(db, `donations/${donationId}/pickupRequests/${volunteerId}`), {
        status: "Completed",
      });
  
      // 🔔 Notify donor & recipient
      await push(ref(db, `notifications/donors/${donorId}`), {
        message: "Your food has been delivered to the recipient by the volunteer.",
        donationId,
        type: "donation",
        createdAt: Date.now(),
        read: false,
      });
  
      await push(ref(db, `notifications/recipients/${recipientId}`), {
        message: "The food has been delivered. Click 'Received' to mark it as Completed.",
        donationId,
        type: "donation",
        createdAt: Date.now(),
        read: false,
      });
  
      // 🧾 Update volunteer delivery count
      const volunteerRef = ref(db, `volunteer/${volunteerId}`);
      const volunteerSnap = await get(volunteerRef);
      const volunteerData = volunteerSnap.val();
      const currentDelivered = volunteerData?.ordersDelivered || 0;
  
      await update(volunteerRef, {
        ordersDelivered: currentDelivered + 1,
      });
  
      Swal.fire({
        icon: "success",
        title: "Delivered!",
        text: "Food is delivered and notifications sent.",
      });
    } catch (error) {
      console.error("❌ Error in marking as delivered:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
      });
    }
  };  

  useEffect(() => {
    const db = getDatabase();
    const requestsRef = ref(db, "requests");
  
    get(requestsRef).then((requestsSnapshot) => {
      if (requestsSnapshot.exists()) {
        const allRequests = requestsSnapshot.val();
        let pendingRequests = [];
  
        Object.keys(allRequests).forEach((requestId) => {
          const request = allRequests[requestId];
  
          const currentVolunteerStatus = request.volunteers?.[auth.currentUser?.uid];
          if (!request.volunteers || !currentVolunteerStatus) return;
  
          const anyVolunteerAccepted = Object.values(request.volunteers || {}).some(
            (req) => req?.status === "Accepted"
          );
  
          const currentVolunteerAccepted = currentVolunteerStatus?.status === "Accepted";
          const showToThisVolunteer = !anyVolunteerAccepted || currentVolunteerAccepted;
  
          if (showToThisVolunteer && currentVolunteerStatus?.status !== "Rejected") {
            pendingRequests.push({ id: requestId, ...request });
          }
        });
  
        // ✅ Sort by date descending (latest first)
        pendingRequests.sort((a, b) => new Date(b.date) - new Date(a.date));
  
        setTaskRequests(pendingRequests);
      }
    });
  }, []);  

  useEffect(() => {
    if (highlightId) {
      const element = requestRefs.current[String(highlightId)];
  
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

  const markFoodAsPickedUpD = async (requestId, volunteerId) => {
    const db = getDatabase();
    const requestRef = ref(db, `requests/${requestId}`);
  
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to confirm the food pickup?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, confirm it!",
      cancelButtonText: "No, cancel",
    });
  
    // ❌ If user cancels
    if (!result.isConfirmed) return;
    
    try {
      const snapshot = await get(requestRef);
      if (!snapshot.exists()) {
        console.error("❌ Error: Request not found.");
        return;
      }
  
      const requestData = snapshot.val();  // Get the actual data
  
      // Update the request status to "Picked Up"
      await update(requestRef, {
        status: "Picked Up",
      });
  
      // Update the volunteer status to "Picked Up"
      await update(ref(db, `requests/${requestId}/volunteers/${volunteerId}`), {
        status: "Picked Up",
      });
  
      // Send notification to the recipient
      await push(ref(db, `notifications/recipients/${requestData.userId}`), {
        message: "Your food is on the way! A volunteer has picked it up.",
        requestId,
        type:"request",
        createdAt: Date.now(),
        read: false,
      });
  
      Swal.fire({
        icon: "success",
        title: "Pickup Confirmed!",
        text: "Food pickup confirmed and recipient notified!",
      });
    } catch (error) {
      console.error("❌ Error updating pickup status:", error);
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: "Something went wrong while updating pickup status.",
      });
    }
  };  

  const acceptRequestD = async (requestId, volunteerId) => {
    const db = getDatabase();
  
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to accept this request?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Accept it!",
    });
  
    if (!confirm.isConfirmed) return;
    try {
      const requestSnapshot = await get(ref(db, `requests/${requestId}`));
      const requestData = requestSnapshot.val();
  
      // 1. Update this volunteer's status to "Accepted"
      await update(ref(db, `requests/${requestId}/volunteers/${volunteerId}`), {
        status: "Accepted",
      });
  
      // 2. Update request status to "In Progress"
      await update(ref(db, `requests/${requestId}`), {
        status: "Volunteer Accepted",
      });
  
      // 3. Notify the recipient
      const recipientId = requestData.userId;
      await push(ref(db, `notifications/recipients/${recipientId}`), {
        message: `A volunteer has accepted the task for your request.`,
        requestId,
        type:"request",
        createdAt: Date.now(),
        read: false,
      });
  
      // 4. Notify the donor
      if (requestData.donors) {
        await Promise.all(
          Object.keys(requestData.donors).map(async (donorId) => {
            await push(ref(db, `notifications/donors/${donorId}`), {
              message: `A volunteer has accepted the task for your request.`,
              requestId,
              type:"request",
              createdAt: Date.now(),
              read: false,
            });
          })
        );
      }
  
      // 5. Notify & remove/reject other volunteers
      if (requestData.volunteers) {
        await Promise.all(
          Object.keys(requestData.volunteers).map(async (otherVolunteerId) => {
            if (otherVolunteerId !== volunteerId) {
              // Set status to "Rejected"
              await update(ref(db, `requests/${requestId}/volunteers/${otherVolunteerId}`), {
                status: "Rejected",
              });
  
              // Send notification
              await push(ref(db, `notifications/volunteers/${otherVolunteerId}`), {
                message: `The request has already been accepted by another volunteer.`,
                requestId,
                type:"request",
                createdAt: Date.now(),
                read: false,
              });
            }
          })
        );
      }
  
      await Swal.fire({
        icon: "success",
        title: "Request Accepted",
        text: "You have successfully accepted the request!",
      });
    } catch (error) {
      console.error("Error accepting request:", error);
      Swal.fire("Error", "Something went wrong!", "error");
    }
  }; 
  

  const foodDeliveredD = async (requestId, volunteerId) => {
    const db = getDatabase();
    const requestRef = ref(db, `requests/${requestId}`);
  
    try {
      const confirm = await Swal.fire({
        title: "Confirm Delivery",
        text: "Are you sure the food has been delivered?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, Delivered",
        cancelButtonText: "Cancel",
      });
  
      if (!confirm.isConfirmed) {
        return;
      }
      const snapshot = await get(requestRef);
      if (!snapshot.exists()) {
        console.error("Donation not found");
        return;
      }
  
      const requestData = snapshot.val();
      const recipientId = requestData.userId;
  
      // Corrected reference for updating request status
      await update(requestRef, {
        status: "Delivered",
      });
  
      await update(ref(db, `requests/${requestId}/volunteers/${volunteerId}`), {
        status: "Completed",
      });
  
      const donors = requestData.donors;  // Assuming it's an object of volunteers with IDs
      for (const donorId in donors) {
        if (donors[donorId].status === "Accepted") {
          await push(ref(db, `notifications/donors/${donorId}`), {
            message: "Your food has been delivered to the recipient by the volunteer.",
            requestId,
            type:"request",
            createdAt: Date.now(),
            read: false,
          });
        }
      }
  
      await push(ref(db, `notifications/recipients/${recipientId}`), {
        message: "The food has been delivered. Click 'Received' to mark the donation as Completed.",
        requestId,
        type:"request",
        createdAt: Date.now(),
        read: false,
      });
  
      const volunteerRef = ref(db, `volunteer/${volunteerId}`);
      const volunteerSnap = await get(volunteerRef);
      const volunteerData = volunteerSnap.val();

      const currentDelivered = volunteerData?.ordersDelivered || 0;

      await update(volunteerRef, {
        ordersDelivered: currentDelivered + 1,
    });

    Swal.fire({
      icon: "success",
      title: "Delivery Completed",
      text: "Food is delivered and notifications sent!",
    });
    } catch (error) {
      console.error("❌ Error in marking as delivered:", error);
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: "Something went wrong during the delivery process.",
      });
    }
  };  

  return (
    <div className="p-6">
  <h2 className="text-2xl font-bold mb-4 text-[#DE3163]">Available Volunteer Tasks</h2>
  <div className="mb-4 flex flex-wrap gap-4">
  {/* Type filter */}
  <div>
    <label className="mr-2 font-medium">Filter by Type:</label>
    <select className="border p-2 rounded" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
      <option value="all">All</option>
      <option value="donation">Donation</option>
      <option value="request">Request</option>
    </select>
  </div>

  {/* Status filter */}
  <div>
    <label className="mr-2 font-medium">Filter by Status:</label>
    <select className="border p-2 rounded" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
      <option value="all">All</option>
      <option value="Pending">Pending</option>
      <option value="Accepted">Accepted</option>
      <option value="Picked Up">Picked Up</option>
      <option value="Completed">Completed</option>
    </select>
  </div>

  {/* Date filter */}
  <div>
  <label className="mr-2 font-medium">Filter by Date:</label>
  <input
    type="date"
    value={selectedDate}
    onChange={(e) => setSelectedDate(e.target.value)}
    className="border p-2 rounded"
  />
</div>
</div>
  {(tasks.length === 0 && taskRequests.length === 0) ? (
    <p>No pending tasks available.</p>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...tasks.map(task => ({ ...task, type: "donation" })), ...taskRequests.map(req => ({ ...req, type: "request" }))]
  .filter(item => {
    if (filterType !== "all" && item.type !== filterType) return false;
  
    const status = item.type === "donation"
      ? item.pickupRequests?.[auth.currentUser?.uid]?.status
      : item.volunteers?.[auth.currentUser?.uid]?.status;
  
    if (filterStatus !== "all" && status !== filterStatus) return false;
  
    // ✅ Filter by selected date
    if (selectedDate && item.date !== selectedDate) return false;
  
    return true;
  })    
  .map((item) => (
        <div
          key={item.id}
          id={`donation-${item.id}`}
          ref={(el) => item.type === "donation" && (taskRefs.current[item.id] = el)}
          className={`w-full p-4 border rounded shadow-lg flex flex-col justify-between transition-all duration-300
            ${item.id === fadedHighlight ? 'bg-yellow-100 border-yellow-400 border-2 scale-105' : 'bg-white'}
          `}
        >
          <h3 className="font-semibold">{item.foodType}</h3>
          <p>🍽️ Quantity: {item.quantity}</p>
          <p>
          📍 Pickup:{" "} 
            {item.type === "donation"
              ? (item.pickupLocation || "Loading address...")
              : (addressesss[item.id]|| "Loading address...")
            }
          </p>
          <p>
            📦 Delivery:{" "}
            {item.type === "donation"
              ? (addresses[item.id] || "Loading address...")
              : (addressess[item.id]|| "Loading address...")
            }
          </p>
          <p>📅 Date: {item.date}</p>
          {item.message && <p>💬 Message: {item.message}</p>}
          <p>Status: {item.status}</p>

          {/* Action buttons based on type */}
          {item.type === "donation" ? (
            <>
              {item.pickupRequests && item.pickupRequests[auth.currentUser?.uid]?.status === "Pending" && (
                <button className="mt-3 px-4 py-2 bg-green-600 text-white rounded" onClick={() => acceptTask(item.id, auth.currentUser?.uid)}>
                  Accept Task
                </button>
              )}
              {item.pickupRequests && item.pickupRequests[auth.currentUser?.uid]?.status === "Accepted" && (
                <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => markFoodAsPickedUp(item.id, auth.currentUser?.uid)}>
                  Pickup Confirmed
                </button>
              )}
              {item.pickupRequests && item.pickupRequests[auth.currentUser?.uid]?.status === "On the way" && (
                <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => foodDelivered(item.id, auth.currentUser?.uid)}>
                  Delivered
                </button>
              )}
              {(item.pickupRequests?.[auth.currentUser?.uid]?.status === "Accepted" ||
                item.pickupRequests?.[auth.currentUser?.uid]?.status === "Picked Up") && (
                <button className="mt-2 px-4 py-2 bg-purple-600 text-white rounded" onClick={() => navigate(`/map/${item.id}?source=donation`)}>
                  View Route on Map
                </button>
              )}
            </>
          ) : (
            <>
              {item.volunteers && item.volunteers[auth.currentUser?.uid]?.status === "Pending" && (
                <button className="mt-3 px-4 py-2 bg-green-600 text-white rounded" onClick={() => acceptRequestD(item.id, auth.currentUser?.uid)}>
                  Accept Request
                </button>
              )}
              {item.volunteers && item.volunteers[auth.currentUser?.uid]?.status === "Accepted" && (
                <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => markFoodAsPickedUpD(item.id, auth.currentUser?.uid)}>
                  Pickup Confirmed
                </button>
              )}
              {item.volunteers && item.volunteers[auth.currentUser?.uid]?.status === "Picked Up" && (
                <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => foodDeliveredD(item.id, auth.currentUser?.uid)}>
                  Delivered
                </button>
              )}
              {(item.volunteers?.[auth.currentUser?.uid]?.status === "Accepted" ||
                item.volunteers?.[auth.currentUser?.uid]?.status === "Picked Up") && (
                <button className="mt-2 px-4 py-2 bg-purple-600 text-white rounded" onClick={() => navigate(`/map/${item.id}?source=request`)}>
                  View Route on Map
                </button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )}
</div>
  );
};

export default VolunteerTasks;