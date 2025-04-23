import React, { useState, useEffect,useRef } from "react";
import { database, ref, onValue, remove, update,get,push} from "../../firebase";
import { auth} from "../../firebase";
import { useLocation } from "react-router-dom";
import Modal from "react-modal";
import RequestMap from "./RequestMap";
import Swal from "sweetalert2";

Modal.setAppElement("#root");

function Donationhistory() {
  const [donations, setDonations] = useState([]);
  const [userId, setUserId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [editDonation, setEditDonation] = useState({
    time: "12:00",  // Default time in HH:mm format
  });
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [skipCloseConfirm, setSkipCloseConfirm] = useState(false);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const highlightId = queryParams.get("highlight");
  const [fadedHighlight, setFadedHighlight] = useState(null);
  const donationRefs = useRef({});
  const [recipients, setRecipients] = useState({});


  useEffect(() => {
    const body = document.body;
    if (showMap || modalIsOpen) {
      body.style.overflow = 'hidden'; // Prevent scroll
    } else {
      body.style.overflow = 'auto';   // Allow scroll
    }
  
    return () => {
      body.style.overflow = 'auto'; // Cleanup on unmount
    };
  }, [showMap, modalIsOpen]);
  
  useEffect(() => {
    // Check authenticated user
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  useEffect(() => {
    const recipientRef = ref(database, "recipient");
  
    onValue(recipientRef, (snapshot) => {
      if (snapshot.exists()) {
        setRecipients(snapshot.val());
      }
    });
  }, []);  

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

  const openEditModal = (donation) => {
    setEditDonation({ ...donation });
    setModalIsOpen(true);
  };

  // ✅ Close Modal
  const closeModal = () => {
    if (skipCloseConfirm) {
      // 👉 Close directly if update just happened
      setSkipCloseConfirm(false);
      setModalIsOpen(false);
      setEditDonation(null);
      return;
    }
    Swal.fire({
      title: 'Are you sure?',
      text: "You have unsaved changes. Do you really want to close the modal?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, close it!',
      cancelButtonText: 'No, keep editing!',
    }).then((result) => {
      if (result.isConfirmed) {
        setModalIsOpen(false);
        setEditDonation(null);
      } 
    });
  };


const handleDelivery = async (donationId, recipientId) => {
  const confirmResult = await Swal.fire({
    title: "Are you sure?",
    text: "You are about to mark this as 'Out for Delivery'. Notify the recipient?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, proceed",
    cancelButtonText: "Cancel",
  });

  if (confirmResult.isConfirmed) {
    try {
      const donationRef = ref(database, `donations/${donationId}`);
      await update(donationRef, { status: "Out for Delivery" });

      const notificationRef = ref(database, `notifications/recipients/${recipientId}`);
      await push(notificationRef, {
        donationId,
        type:"donation",
        message: "Food is on the way... It will be received soon!",
        read: false,
        createdAt: Date.now(),
      });

      // Update state locally
      setDonations((prev) =>
        prev.map((d) =>
          d.id === donationId ? { ...d, status: "Out for Delivery" } : d
        )
      );

      // ✅ Show success alert
      Swal.fire({
        title: "Success!",
        text: "Recipient has been notified. The food is on the way!",
        icon: "success",
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Oops!",
        text: "Something went wrong while sending the notification.",
        icon: "error",
      });
    }
  }
};
  

const confirmReceived = async (donationId, recipientId) => {
  const confirmResult = await Swal.fire({
    title: "Confirm Delivery?",
    text: "Are you sure the food has been delivered to the recipient?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, Delivered",
    cancelButtonText: "Cancel",
  });

  if (confirmResult.isConfirmed) {
    try {
      const donationRef = ref(database, `donations/${donationId}`);
      await update(donationRef, { status: "Delivered" });

      const notificationRef = ref(database, `notifications/recipients/${recipientId}`);
      await push(notificationRef, {
        donationId,
        type: "donation",
        message: "Your food donation has been successfully delivered! Please click the 'Received' button to mark the donation as complete.",
        read: false,
        createdAt: Date.now(),
      });

      setDonations((prev) =>
        prev.map((d) =>
          d.id === donationId ? { ...d, status: "Delivered" } : d
        )
      );

      // ✅ Show success message
      Swal.fire({
        title: "Marked as Delivered!",
        text: "Recipient has been notified about the successful delivery.",
        icon: "success",
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error!",
        text: "Something went wrong while marking as delivered.",
        icon: "error",
      });
    }
  }
};
  

  const handleViewMap = (donationId) => {
    const selectedDonation = donations.find(d => d.id === donationId);
  
    if (!selectedDonation) {
      alert("Donation not found.");
      return;
    }
  
    const recipientId = selectedDonation.recipientId;
    const recipientData = selectedDonation.recipients?.[recipientId];
  
    if (
      !recipientData ||
      !recipientData.location ||
      !recipientData.location.latitude ||
      !recipientData.location.longitude
    ) {
      alert("Location not available for this recipient.");
      return;
    }
  
    // ✅ Set the location for map
    setSelectedRecipient({
      latitude: recipientData.location.latitude,
      longitude: recipientData.location.longitude,
    });
    setShowMap(true);
  };
   

  const pickupconfirm = async (donationId, recipientId) => {
    console.log("Recipient ID:", recipientId);
    const donationRef = ref(database, `donations/${donationId}`);
  
    // 1. Update donation status
    await update(donationRef, { status: "Delivered" });
  
    // 2. Send notification to recipient
    const notificationRef = ref(database, `notifications/recipients/${recipientId}`);
    push(notificationRef, {
      donationId,
      type:"donation",
      message: "Are You recevied the food...If you recived it please click the Recived",
      read: false, // To track unread notifications
      createdAt: Date.now(),
    });
    setDonations((prev) =>
      prev.map((d) =>
        d.id === donationId ? { ...d, status: "Delivered" } : d
      )
    );
  };

  useEffect(() => {
    if (userId) {
      setLoading(true);
      const donationsRef = ref(database, "donations");
  
      const unsubscribe = onValue(donationsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const filteredDonations = Object.entries(data)
            .filter(([key, donation]) => donation.userId === userId)
            .map(([key, donation]) => ({ id: key, ...donation }))
            .sort((a, b) => b.createdAt - a.createdAt); // 🔥 Sort by timestamp
  
          setDonations(filteredDonations);
        } else {
          setDonations([]);
        }
        setLoading(false);
      });
  
      return () => unsubscribe(); // Cleanup Firebase listener
    }
  }, [userId]);  

  const handleChange = (e) => {
    setEditDonation({ ...editDonation, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
  e.preventDefault();
  let newErrors = {};

  // Validation Checks
  if (!editDonation.quantity || editDonation.quantity <= 0) {
    newErrors.quantity = "Quantity must be a positive number.";
  }
  if (!editDonation.pickupLocation || editDonation.pickupLocation.length < 5) {
    newErrors.pickupLocation = "Pickup location must be at least 5 characters long.";
  }
  const today = new Date().toISOString().split("T")[0];
  if (!editDonation.date || editDonation.date < today) {
    newErrors.date = "Date must be today or a future date.";
  }
  if (
    (editDonation.foodType === "Tiffin" || editDonation.foodType === "CookedMeal") &&
    new Date(editDonation.date) > new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  ) {
    newErrors.date = "For Tiffin and CookedMeal, donation date cannot be more than 2 days ahead.";
  }
  if (!editDonation.time) {
    newErrors.time = "Please select a valid time.";
  }

  // Set errors and return if any validation failed
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  // 🟡 Ask for confirmation before updating
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "Do you want to update this donation?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Update it!",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return; // User cancelled

  try {
    await update(ref(database, "donations/" + editDonation.id), {
      foodType: editDonation.foodType,
      quantity: editDonation.quantity,
      pickupLocation: editDonation.pickupLocation,
      date: editDonation.date,
      time: editDonation.time,
      message: editDonation.message || "",
    });

    setSkipCloseConfirm(true);
    setIsEditing(false);
    setEditDonation(null);
    setModalIsOpen(false);
    await Swal.fire({
      title: 'Updated!',
      text: 'Donation updated successfully.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("Error updating donation:", error);
    await Swal.fire({
      title: 'Error!',
      text: 'Failed to update donation. Please try again.',
      icon: 'error',
      confirmButtonText: 'OK',
    });
    setErrors({ global: "Failed to update donation. Please try again." });
  }
};

  const handleDelete = async (donationId) => {
    const { value: confirmDelete } = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to delete this donation?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel',
    });
    if (confirmDelete) {
      try {
        await remove(ref(database, "donations/" + donationId));
        await  Swal.fire({
          title: 'Deleted!',
          text: 'Donation deleted successfully.',
          icon: 'success',
          timer: 2000,  // Automatically close after 2 seconds
          showConfirmButton: false,
          confirmButtonText: 'OK',
        });
      } catch (error) {
        console.error("Error deleting donation:", error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete donation.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
    }
  };

  const filteredDonations = donations
  .filter((donation) => {
    const matchesStatus = filterStatus === "All" || donation.status === filterStatus;
    const matchesDate = filterDate ? donation.date === filterDate : true;
    return matchesStatus && matchesDate;
  })
  const Pickedbyvolunteer = async (donationId) => {
    const donationRef = ref(database, `donations/${donationId}`);
    const snapshot = await get(donationRef);
  
    if (snapshot.exists()) {
      const donationData = snapshot.val();
  
      // ✅ Get volunteer ID from donation data
      const volunteerId = donationData.acceptedBy?.userId;
      console.log(volunteerId);
  
      if (!volunteerId) {
        alert("Volunteer not found for this donation ❌");
        return;
      }
  
      // ✅ Update donation & volunteer status
      const updates = {};
      updates[`donations/${donationId}/status`] = "Delivered";
      updates[`donations/${donationId}/volunteers/${volunteerId}/status`] = "Delivered";
  
      await update(ref(database), updates);
  
      // ✅ Notify the volunteer
      const volunteerNotification = {
        type: "donation",
        donationId: donationId,
        role:"volunteer",
        message: `You have picked up the donation. Please deliver it on time and make it completed`,
        read: false,
        createdAt: Date.now(),
      };
      await push(ref(database, `notifications/volunteers/${volunteerId}`), volunteerNotification);
  
      alert("Marked as Picked Up ✅. Volunteer notified.");
    } else {
      alert("Donation not found ❌");
    }
  };  

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-center mb-6 text-[#DE3163]">My Donations</h2>
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        <div>
        <label className="font-bold mr-2">Filter by Status:</label>
        <select
          className="border p-2 rounded"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      {/* ✅ Filter by Date */}
      <div>
        <label className="font-bold mr-2">Filter by Date:</label>
        <input
          type="date"
          className="border p-2 rounded"
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading donations...</p>
      ) : filteredDonations.length === 0 ? (
        <p className="text-center text-gray-500">{filterStatus === "Pending"
          ? "No Pending Donations"
          : filterStatus === "Completed"
          ? "No Completed Donations"
          : filterStatus === "Expired"
          ? "No Expired Donations"
          : "No Donations Found"}</p>
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-4 mt-5">
            {filteredDonations.map((donation) => (
              <div
              key={donation.id}
              ref={(el) => (donationRefs.current[donation.id] = el)} // Make sure refs are correctly assigned
              className={`w-full sm:w-[45%] lg:w-[30%] p-4 border rounded shadow-lg bg-white flex flex-col justify-between transition-all duration-300 ${
                donation.id === fadedHighlight ? "bg-yellow-100 border-l-4 border-yellow-500" : "bg-white"
              }`}
            >
                    <p><strong>Food Type:</strong> {donation.foodType}</p>
                    <p><strong>Quantity:</strong> {donation.quantity} kg</p>
                    <p><strong>Pickup Location:</strong> {donation.pickupLocation}</p>
                    <p><strong>Date:</strong> {donation.date}</p>
                    <p><strong>Time:</strong> {donation.time}</p>
                    <p><strong>Details:</strong>{donation.message}</p>
                    <p><strong>Status:</strong> 
                      {donation.status === "Accepted" && !donation.handleDelivery ? "Waiting for Pickup" :
                      donation.status === "Accepted" && donation.volunteerAssigned ? "Volunteer Assigned" :
                      donation.status === "Picked Up" ? "Food Picked Up" :
                      donation.status}
                    </p>
                    {donation.handleDelivery && (
                     <div><p><strong>Delivery Mode:</strong>You have chosen to handle delivery.</p></div>
                    )}
                    {/* ✅ Recipient Info after accepted */}
                  {donation.status !== "Pending" && donation.status !=="Completed" && donation.recipientId && (
                    <div className="mt-2 p-2 border rounded bg-gray-50">
                      <p><strong>Recipient Name:</strong> {recipients?.[donation.recipientId]?.username}</p>
                      <p><strong>Phone:</strong> {recipients?.[donation.recipientId]?.contact}</p>
                      <p><strong>Charity Name:</strong> {recipients?.[donation.recipientId]?.charityName}</p>
                      <p><strong>Charity Reg No:</strong> {recipients?.[donation.recipientId]?.charityRegNo}</p>
                    </div>
                  )}
              {donation.status === "Accepted" && donation.handleDelivery && (
                <button
                  onClick={() => handleDelivery(donation.id,donation.recipientId)}
                  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Accept and Deliver Now
                </button>
              )}
              {( donation.status ==="Volunteer Rejected") && (
                <button
                  onClick={() => handleDelivery(donation.id,donation.recipientId)}
                  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Accept and Deliver Now
                </button>
              )}
              {donation.status === "Picked Up" && donation.acceptedBy && (
                <button
                  onClick={() => Pickedbyvolunteer(donation.id,donation.recipientId)}
                  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Food is Picked by Volunteer
                </button>
              )}
              {donation.status.toLowerCase() === "out for delivery" && (
                <button
                  onClick={() => confirmReceived(donation.id,donation.recipientId)}
                  className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Deliverd
                </button>
              )}
              {donation.recipients?.[donation.recipientId]?.status === "Accepted" && donation.status ==="Out for Delivery" &&
                donation.handleDelivery &&
                donation.recipientId && (
                  <button
                    onClick={() => handleViewMap(donation.id)}
                    className="mt-2 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    View Recipient Location
                  </button>
              )}
<Modal
  isOpen={showMap}
  onRequestClose={() => setShowMap(false)}
  contentLabel="Map Modal"
  className="bg-white p-5 rounded-lg shadow-xl w-3/4 mx-auto mt-20 relative"
  overlayClassName="fixed inset-0  bg-opacity-30 backdrop-blur-md flex items-center justify-center"
>
  <button
    onClick={() => setShowMap(false)}
    className="absolute -top-1 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-lg"
  >
    ✖
  </button>
  <RequestMap request={selectedRecipient} />
</Modal>

              {donation.status.toLowerCase() === "on the way" && (
                <button
                  onClick={() => pickupconfirm(donation.id,donation.recipientId)}
                  className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Pickup Confirm
                </button>
              )}

              {/* Show Edit and Delete only if status is "Pending" */}
              {donation.status === "Pending" && (
                <div className="mt-3">
                  {/* ✅ "Edit" Button - Opens Modal */}
                  <button
                    onClick={() => openEditModal(donation)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(donation.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded"
                  >
                    Delete
                  </button>
                </div>
              )}
              </div>
            ))}
          </div>
        </>
      )}
      {/* ✅ Edit Donation Popup Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Edit Donation"
        className="bg-white p-5 rounded-lg shadow-xl w-3/4 mx-auto mt-20 relative"
        overlayClassName="fixed inset-0  bg-opacity-30 backdrop-blur-md flex items-center justify-center"
      >
        {editDonation && (
          /* ✅ Edit Form */
          <form onSubmit={handleUpdate}>
                  <label htmlFor="foodType" className="font-bold">Food Type:</label>
                  <input
                    id="foodType"
                    type="text"
                    value={editDonation.foodType}
                    disabled
                    className="mb-2 block w-full px-3 py-2 border rounded bg-gray-200"
                  />
                
                  <label htmlFor="quantity" className="font-bold">Quantity:</label>
                  <input
                    id="quantity"
                    type="number"
                    value={editDonation.quantity}
                    onChange={(e) =>
                      setEditDonation({ ...editDonation, quantity: e.target.value })
                    }
                    className="mb-2 block w-full px-3 py-2 border rounded"
                  />
                  {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity}</p>}
                
                  <label htmlFor="pickupLocation" className="font-bold">Pickup Location:</label>
                  <input
                    id="pickupLocation"
                    type="text"
                    value={editDonation.pickupLocation}
                    disabled
                    onChange={(e) =>
                      setEditDonation({ ...editDonation, pickupLocation: e.target.value })
                    }
                    className="mb-2 block w-full px-3 py-2 border rounded bg-gray-200"
                  />
                  {errors.pickupLocation && <p className="text-red-500 text-sm">{errors.pickupLocation}</p>}
                
                  <label htmlFor="date" className="font-bold">Expiry Date:</label>
                  <input
                    id="date"
                    type="date"
                    value={editDonation.date}
                    disabled
                    onChange={(e) => setEditDonation({ ...editDonation, date: e.target.value })}
                    className="mb-2 block w-full px-3 py-2 border rounded bg-gray-200"
                    required
                  />
                  {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
                
                  <label htmlFor="time" className="font-bold">Expiry Time:</label>
                  <input
                    id="time"
                    type="time"
                    value={editDonation.time ? editDonation.time.slice(0,5) : ""}
                    onChange={(e) => setEditDonation({ ...editDonation, time: e.target.value })}
                    className="mb-2 block w-full px-3 py-2 border rounded"
                  />
                  {errors.time && <p className="text-red-500 text-sm">{errors.time}</p>}
                
                  <label htmlFor="message" className="font-bold">Message:</label>
                  <textarea
                    id="message"
                    value={editDonation.message}
                    onChange={(e) => setEditDonation({ ...editDonation, message: e.target.value })}
                    className="mb-2 block w-full px-3 py-2 border rounded"
                  ></textarea>   
                  {errors.global && <p className="text-red-500 text-sm text-center">{errors.global}</p>}
                
                  <button type="submit" className="bg-green-500 px-4 py-2 text-white rounded">
                    Update
                  </button>
                  <button
                    onClick={closeModal}
                    type="button"
                    className="ml-2 bg-gray-500 px-4 py-2 text-white rounded"
                  >
                    Cancel
                  </button>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default Donationhistory;
