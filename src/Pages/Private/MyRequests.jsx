import { useEffect, useState,useRef } from "react";
import { getDatabase, ref,get,set,push, onValue, remove, update } from "firebase/database";
import { auth,database } from "../../firebase";
import { useLocation } from "react-router-dom";
import Modal from "react-modal";
import DonorMap from "./DonorMap";
import Swal from "sweetalert2";

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [editingRequest, setEditingRequest] = useState(null);
  const [editData, setEditData] = useState({});
  const[selectedDonor,setSelectedDonor]=useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [mapModalIsOpen, setMapModalIsOpen] = useState(false);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const highlightId = queryParams.get("highlight");
  const [fadedHighlight, setFadedHighlight] = useState(null);
  const requestRefs = useRef({});
  const [donorDetails, setDonorDetails] = useState({});
  const [filterDate, setFilterDate] = useState("");

  const database = getDatabase();
  const user = auth.currentUser;

  useEffect(() => {
    if (modalIsOpen || mapModalIsOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [modalIsOpen, mapModalIsOpen]);
  

  const openMapModal = async (requestId,donorId) => {
    try {
      const donorRef = ref(database, `requests/${requestId}/donors/${donorId}`);
      const snapshot = await get(donorRef);
  
      if (snapshot.exists()) {
        const data = snapshot.val();
  
        if (data.status === "Accepted" && data.location) {
          const donorLocation = {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            status: data.status,
          };
  
          setSelectedDonor(donorLocation);
          setMapModalIsOpen(true);
        } else {
          alert("Location not available or not accepted");
        }
      } else {
        console.log("❌ No donor data found at:", donorPath);
      }
    } catch (error) {
      console.error("🔥 Error fetching donor data:", error);
    }
  };    
  
  const closeMapModal = () => {
    setSelectedDonor(null);
    setMapModalIsOpen(false);
  };

  useEffect(() => {
    const fetchDonorDetails = async () => {
      const updatedDetails = {};
  
      for (const request of filteredRequests) {
        if (request.acceptedby) {
          const donorRef = ref(database, `donor/${request.acceptedby}`);
          const snapshot = await get(donorRef);
          if (snapshot.exists()) {
            updatedDetails[request.id] = snapshot.val(); // e.g. { username: "Raj", contact: "..." }
          }
        }
      }
  
      setDonorDetails(updatedDetails);
    };
  
    fetchDonorDetails();
  }, [filteredRequests]);

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

  useEffect(() => {
    if (!user) return;
    const requestsRef = ref(database, "requests");
  
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userRequests = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((req) => req.userId === user.uid);
  
        // Sort by date (latest first)
        const sortedRequests = userRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
        setRequests(sortedRequests);
        setFilteredRequests(sortedRequests);
      } else {
        setRequests([]);
        setFilteredRequests([]);
      }
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, [user]);  
  
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you really want to delete this request?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (result.isConfirmed) {
      await remove(ref(database, `requests/${id}`));
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Request deleted successfully!',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setEditingRequest(null);
    if (status === "All") {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter((req) => req.status === status));
    }
  };

  const handleCancelEdit = async (e) => {
    // Prevent any default form or button behavior
    if (e) e.preventDefault();
  
    const result = await Swal.fire({
      title: 'Discard changes?',
      text: 'Are you sure you want to cancel editing? Unsaved changes will be lost.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, discard',
      cancelButtonText: 'No, keep editing',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });
  
    if (result.isConfirmed) {
      setEditingRequest(null);
      setModalIsOpen(false);
      setEditData({});
    }
  };
  
  const handleEdit = (request) => {
    setEditingRequest(request.id);
    setEditData({
      foodType:request.foodType,
      quantity: request.quantity,
      date: request.date,
      time: request.time,
      urgency: request.urgency,
      message: request.message,
    });
    setModalIsOpen(true);
  };

  const handleSave = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to save the changes?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, save it!',
      cancelButtonText: 'Cancel',
    });
  
    if (result.isConfirmed) {
      const sanitizedData = Object.fromEntries(
        Object.entries(editData).map(([key, value]) => [key, value ?? ""])
      );
      
      await update(ref(database, `requests/${id}`), sanitizedData);
      setEditingRequest(null);
      setModalIsOpen(false);
  
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Request updated successfully!',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  const handleReadyForPickup = async (id) => {
    const requestRef = ref(database, `requests/${id}`);
  
    try {
      const result = await Swal.fire({
        title: 'Confirm Ready for Pickup',
        text: 'Are you sure the recipient is on the way?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Proceed',
        cancelButtonText: 'Cancel',
      });
  
      if (!result.isConfirmed) return;
      const snapshot = await get(requestRef);
      if (!snapshot.exists()) {
        Swal.fire('Error', 'Request not found!', 'error');
        return;
      }
  
      const requestData = snapshot.val();
      const donors = requestData.donors || {}; // Extract donors object
  
      // Find the donor who accepted the request
      const acceptedDonorId = Object.keys(donors).find(
        (donorId) => donors[donorId].status === "Accepted"
    );
      // Update the request status
      await update(requestRef, { status: "Ready for Pickup" });
  
      // Send a notification only to the accepted donor
      if (acceptedDonorId) {
        const donorNotificationRef = push(ref(database, `notifications/donors/${acceptedDonorId}`));
        await set(donorNotificationRef, {
          message: "Recipient is on the way. Please prepare the food",
          createdAt: Date.now(),
          type:"request",
          requestId: id,
          read:false
        });
  
        await Swal.fire('Completed ✅', 'The donor has been notified to prepare the food.', 'success');
      }
    } catch (error) {
      console.error("Error updating status:", error);
      Swal.fire('Error', 'Something went wrong while updating the request.', 'error');
    }
  };  

  const handleReceived = async (id) => {
    const requestRef = ref(database, `requests/${id}`);
  
    try {
      const result = await Swal.fire({
        title: 'Confirm Received',
        text: 'Are you sure you have received the food?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Received',
        cancelButtonText: 'Cancel',
      });
  
      if (!result.isConfirmed) return;
      const snapshot = await get(requestRef);
      if (!snapshot.exists()) {
        Swal.fire('Error', 'Request not found!', 'error');
        return;
      }
  
      const requestData = snapshot.val();
      const donors = requestData.donors || {};
      const volunteers = requestData.volunteers || {};
      const recipientId = auth.currentUser?.uid;
  
      const acceptedDonorId = Object.keys(donors).find(
        (donorId) => donors[donorId].status === "Accepted"
      );
  
      const acceptedVolunteerId = Object.keys(volunteers).find(
        (volId) =>
          volunteers[volId].status === "Accepted" ||
          volunteers[volId].status === "Picked Up"
      );
  
      // ✅ Update request status
      await update(requestRef, { status: "Completed" });
  
      // ✅ Notify donor
      if (acceptedDonorId) {
        const donorNotificationRef = push(ref(database, `notifications/donors/${acceptedDonorId}`));
        await set(donorNotificationRef, {
          message: "The food has been successfully received! Thank you for your donation. ❤️",
          createdAt: Date.now(),
          type:"request",
          requestId: id,
          read: false
        });
      }
  
      // ✅ Notify volunteer
      if (acceptedVolunteerId) {
        const volunteerNotificationRef = push(ref(database, `notifications/volunteers/${acceptedVolunteerId}`));
        await set(volunteerNotificationRef, {
          message: "The food has been successfully delivered! Thank you for your help. 🚚❤️",
          createdAt: Date.now(),
          type:"request",
          requestId: id,
          read: false
        });
      }
  
      // ✅ Store feedback structure
      const feedbackRef = ref(database, `request_feedback/${id}`);
      const feedbackData = {};
  
      if (recipientId) {
        feedbackData[recipientId] = {
          feedback: "",
          rating: null,
          status: "pending",
        };
      }
  
      if (acceptedDonorId) {
        feedbackData[acceptedDonorId] = {
          feedback: "",
          rating: null,
          status: "pending",
        };
      }
  
      if (acceptedVolunteerId) {
        feedbackData[acceptedVolunteerId] = {
          feedback: "",
          rating: null,
          status: "pending",
        };
      }
  
      await set(feedbackRef, feedbackData);
  
      await Swal.fire('Completed ✅', 'Marked as Received — Feedback section created!', 'success');

    } catch (error) {
      console.error("❌ Error updating status:", error);
      Swal.fire('Error', 'Something went wrong while updating the request.', 'error');
    }
  };  

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-[#DE3163] text-center">My Requests</h2>
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
        <p className="text-center">Loading...</p>
      ) : filteredRequests.length === 0 ? (
        <p className="text-center text-gray-500">No Requests Found</p>
      ) : (
        <div>
         <div className="flex flex-wrap justify-center gap-4">
          {filteredRequests
          .filter((request) => {
            const matchesStatus = filterStatus === "All" || request.status === filterStatus;
            const matchesDate = !filterDate || request.date === filterDate;
            return matchesStatus && matchesDate;
          })
          .map((request,index) => (
            <div
            key={request.id}
            className={`w-full sm:w-[45%] lg:w-[30%] p-4 border rounded shadow-md transition-colors duration-300 ${
              request.id === fadedHighlight
                ? "bg-yellow-100 border-l-4 border-yellow-500"
                : "bg-white"
            }`}
          >          
            <p><strong>Food Type:</strong> {request.foodType}</p>
            <p><strong>Quantity:</strong> {request.quantity} kg</p>
            <p><strong>Date:</strong> {request.date} | <strong>Time:</strong> {request.time}</p>
            <p><strong>Urgency:</strong> {request.urgency}</p>
            <p><strong>Status:</strong> 
              <span className={`ml-2 font-bold ${request.status === "Pending" ? "text-yellow-500" : "text-green-500"}`}>
                {request.status}
              </span>
            </p>
            {request.message && <p><strong>Message:</strong> {request.message}</p>}
            {!request.deliveryOption && request.status === "Completed" && <p><strong>Delivery option:</strong> Pickup by Me</p>}
            {request.deliveryOption && request.status === "Completed" && !request.volunteers && <p><strong>Delivery option:</strong>Delievered by donor</p>}
            {request.deliveryOption && request.status === "Completed" && request.volunteers && <p><strong>Delivery option:</strong>Delievered by Volunteer</p>}
            {request.status !== "Reject" && (
  <>
    {request.status !== "Pending" &&  (
      <div className="mt-2 p-2 bg-gray-50 border rounded">
      <p><strong>Accepted By:</strong> {donorDetails[request.id]?.username || "Unknown"}</p>
      <p><strong>Contact:</strong> {donorDetails[request.id]?.contact || "Not Available"}</p>
    </div>
    )}
    {request.status !== "Pending" &&  !request.deliveryOption && request.status !== "Completed" && (
      <button
      onClick={() => openMapModal(request.id,request.acceptedby)}
      className="mt-2 px-3 py-2 bg-blue-500 text-white rounded w-full block"
    >
      View on Map 📍
    </button>
    )}

    {request.status === "Pending" && (
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => handleEdit(request)}
          className="px-3 py-2 bg-yellow-500 text-white rounded w-full block"
        >
          Edit
        </button>
        <button
          onClick={() => handleDelete(request.id)}
          className="px-3 py-2 bg-red-500 text-white rounded w-full block"
        >
          Delete
        </button>
      </div>
    )}
    {request.status === "In Progress" && !request.deliveryOption && (
      <div className="mt-3">
        <button
          onClick={() => handleReadyForPickup(request.id)}
          className="px-3 py-2 bg-blue-500 text-white rounded w-full block"
        >
          I'm on the Way
        </button>
      </div>
    )}
    {request.status === "Picked Up" && !request.deliveryOption && (
      <div className="mt-3">
        <p className="text-green-600 font-bold">
          Food has been picked up. Confirm if received.
        </p>
        <button
          onClick={() => handleReceived(request.id)}
          className="mt-3 px-3 py-2 bg-green-500 text-white rounded w-full block"
        >
          Confirm Pickup
        </button>
      </div>
    )}
    {request.status === "Delivered" && request.deliveryOption && (
      <div className="mt-3">
        <p className="text-green-600 font-bold">
          Food has been Delivered by the donor. Confirm if received.
        </p>
        <button
          onClick={() => handleReceived(request.id)}
          className="mt-3 px-3 py-2 bg-green-500 text-white rounded w-full block"
        >
          Received
        </button>
      </div>
    )}
    {request.status === "Completed" && (
      <p className="text-gray-600 pt-2 font-bold">Request Completed. Thank you!</p>
    )}
  </>
)}
          </div>
          ))}
          </div>
          </div>
          )}
              <Modal
        isOpen={modalIsOpen} onRequestClose={handleCancelEdit} 
        contentLabel="Edit Donation"
        className="bg-white p-5 rounded-lg shadow-xl w-3/4 mx-auto mt-20 relative"
        overlayClassName="fixed inset-0  bg-opacity-30 backdrop-blur-md flex items-center justify-center"
      >
              {editingRequest && (
                <form onSubmit={(e) => { e.preventDefault(); handleSave(editingRequest); }}>
                  <label className="block mt-2">Food Type:</label>
                  <input
                    type="text"
                    min="1"
                    value={editData.foodType}
                    onChange={(e) => setEditData({ ...editData, foodType: e.target.value })}
                    disabled
                    className="block w-full p-1 border rounded"
                  />
                  <label className="block mt-2">Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={editData.quantity}
                    onChange={(e) => setEditData({ ...editData, quantity: e.target.value })}
                    className="block w-full p-1 border rounded"
                  />
  
                  <label className="block mt-2">Date:</label>
                  <input
                    type="date"
                    value={editData.date}
                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                    disabled
                    className="block w-full p-1 border rounded"
                  />
  
                  <label className="block mt-2">Time:</label>
                  <input
                    type="time"
                    value={editData.time}
                    onChange={(e) => setEditData({ ...editData, time: e.target.value })}
                    className="block w-full p-1 border rounded"
                  />
  
                  <label className="block mt-2">Urgency:</label>
                  <select
                    value={editData.urgency}
                    onChange={(e) => setEditData({ ...editData, urgency: e.target.value })}
                    className="block w-full p-1 border rounded"
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="Few Hours">Few Hours</option>
                    <option value="Anytime">Anytime</option>
                  </select>
  
                  <label className="block mt-2">Message:</label>
                  <textarea
                    value={editData.message}
                    onChange={(e) => setEditData({ ...editData, message: e.target.value })}
                    className="block w-full p-1 border rounded"
                  />
                  <button
                  type="button"
                    onClick={() => handleSave(editingRequest)}
                    className="mt-2 px-3 py-1 bg-green-500 text-white rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="ml-5 px-3 py-1 bg-gray-500 text-white rounded"
                  >
                    Cancel
                  </button>
                  </form>
                  )}
                </Modal>
                <Modal
  isOpen={mapModalIsOpen}
  onRequestClose={closeMapModal}
  contentLabel="Request Location"
  className="bg-white p-5 rounded-lg shadow-xl w-4/5 mx-auto mt-20"
  overlayClassName="fixed inset-0 bg-opacity-30 backdrop-blur-md flex items-center justify-center"
>
  <div className="relative w-full">
    <button 
      onClick={closeMapModal} 
      className="absolute -top-1 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-lg"
    >
      ✖
    </button>
  </div>
  {selectedDonor && <DonorMap donor={selectedDonor} />}
</Modal>
            </div>
  );
};

export default MyRequests;
