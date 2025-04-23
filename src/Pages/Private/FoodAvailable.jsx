import { getDatabase, ref, update, get } from "firebase/database";
import { useState, useEffect,useRef } from "react";
import Modal from "react-modal";
import DonorMap from "./DonorMap";
import { push,set } from "../../firebase";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const FoodAvailable = () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [availableDonations, setAvailableDonations] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const queryParams = new URLSearchParams(location.search);
  const highlightId = queryParams.get("highlight");
  const [filterDate, setFilterDate] = useState(""); // default: show all
  const navigate = useNavigate();
  const [fadedHighlight, setFadedHighlight] = useState(null);
  const requestRefs = useRef({});

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
    const fetchAvailableDonations = async () => {
      const db = getDatabase();
      const donationRef = ref(db, 'donations');
      const snapshot = await get(donationRef);
      if (snapshot.exists()) {
        const donations = snapshot.val();
        const filtered = [];
        for (const [id, donation] of Object.entries(donations)) {
          const isNotGrocery = donation.foodType !== 'Grocery';
          const isDonationOngoing = ['Pending', 'Accepted', 'Picked Up','Delivered', 'Completed'].includes(donation.status);
          const volunteerStatus = donation?.volunteers?.[currentUser.uid]?.status;

          const isAvailableToThisVolunteer = 
            volunteerStatus === "Pending" || 
            volunteerStatus === "Accepted" || 
            volunteerStatus === "Picked Up" || 
            volunteerStatus === "Delivered" || 
            volunteerStatus === "Completed";

          const recipients = donation?.recipients || {};
          const hasRecipientInProgress = Object.values(recipients).some(
            (recipient) =>
              recipient.status === "Accepted" ||
              recipient.status === "Picked Up" ||
              recipient.status === "Completed"
          );
  
          if (
            isNotGrocery &&
            isDonationOngoing &&
            isAvailableToThisVolunteer &&
            donation.notified30min &&
            !hasRecipientInProgress
          ) {
            filtered.push({ id, ...donation });
          }
        }
        // ✅ Sort by date + time descending (latest first)
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAvailableDonations(filtered);
      }
    };
    if (currentUser?.uid) {
      fetchAvailableDonations();
    }
  }, [currentUser]);         
  // ✅ Accept and reject logic
  const acceptDonation = async (donationId) => {
    const db = getDatabase();
    const donationRef = ref(db , `donations/${donationId}`);
    const snapshot = await get(donationRef);
    if (!snapshot.exists()) {
      Swal.fire({
        title: 'Error!',
        text: 'Donation not found ❌',
        icon: 'error',
        timer: 4000, // 4 seconds
        timerProgressBar: true,
        showConfirmButton: false
      });
      return;
    }

    const donation = snapshot.val();
    if (!donation.volunteers) return;
    const updates = {};
    // ✅ Update volunteer statuses
    for (const [id, data] of Object.entries(donation.volunteers)) {
      if (id === currentUser.uid) {
        updates[`volunteers/${id}/status`] = "Accepted";
      } else {
        updates[`volunteers/${id}/status`] = "Rejected";
        // ❗ Notify rejected volunteers
        const rejectedNotification = {
          message: `The donation of ${donation.foodType} is no longer available.`,
          read: false,
          createdAt: Date.now(),
        };
        await push(ref(db, `notifications/volunteers/${id}`), rejectedNotification);
      }
    }
    // ✅ Notify and update all recipients
    if (donation.recipients) {
      for (const [recipientId, recipientData] of Object.entries(donation.recipients)) {
        updates[`recipients/${recipientId}/status`] = "Not Available";
        const recipientNotification = {
          message: `Sorry! The donation of ${donation.foodType} is no longer available.`,
          read: false,
          createdAt: Date.now(),
        };
        await push(ref(db, `notifications/recipients/${recipientId}`), recipientNotification);
      }
    }
    // ✅ Donor notification
    const donorNotification = {
      type:"donation",
      donationId:donationId,
      message: `A volunteer has accepted your ${donation.foodType} donation.`,
      read: false,
      createdAt: Date.now(),
    };
    await push(ref(db, `notifications/donors/${donation.userId}`), donorNotification);
    // ✅ Final updates
    updates[`status`] = "Accepted";
    updates[`acceptedBy`] = {
      userId: currentUser.uid,
      role: "volunteer",
    };
    await update(donationRef, updates);
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to accept this donation?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Accept it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // ✅ Show success alert after confirmation
        Swal.fire({
          title: 'Accepted!',
          text: 'You accepted the donation ✅',
          icon: 'success',
          timer: 4000,
          timerProgressBar: true,
          showConfirmButton: false
        });
        // 🔁 Call your logic here to update Firebase or backend
        // acceptDonation(donationId);
      }
    });
    // ✅ Remove from list
    setAvailableDonations(prev => prev.filter(d => d.id !== donationId));
  };
  const markAsPickedUp = async (donationId) => {
    const db = getDatabase();
    const donationRef = ref(db,`donations/${donationId}`);
    const snapshot = await get(donationRef);
    if (snapshot.exists()) {
      const updates = {};
      updates[`volunteers/${currentUser.uid}/status`] = "Picked Up";
      updates[`status`] = "Picked Up"; // global status
      await update(donationRef, updates);
      // Send notification to donor
      const pickupNotification = {
        type:"doantion",
        doantionId:donationId,
        message:` The volunteer has picked up your donation!`,
        read: false,
        createdAt: Date.now(),
      };
      await push(ref(db, `notifications/donors/${snapshot.val().userId}`), pickupNotification);
      Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to mark this donation as Picked Up?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Picked Up!',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          // ✅ Show success popup after confirmation
          Swal.fire({
            title: 'Picked Up!',
            text: 'Donation marked as Picked Up ✅',
            icon: 'success',
            timer: 4000,
            timerProgressBar: true,
            showConfirmButton: false
          });
          // 🔁 Your logic to update status in Firebase or backend
          // example: markDonationAsPickedUp(donationId);
        }
      });   
    }
  };

  const delivered = async (donationId) => {
    const db = getDatabase();
    const donationRef = ref(db, `donations/${donationId}`);
    const snapshot = await get(donationRef);
    if (snapshot.exists()) {
      const donationData = snapshot.val();
      const donorId = donationData.userId;
      const volunteerId = currentUser.uid;
      // 1️⃣ Update donation & volunteer statu
      const updates = {};
      updates[`volunteers/${volunteerId}/status`] = "Completed";
      updates[`status`] = "Completed";
      await update(donationRef, updates);
      // 2️⃣ Notify the donor
      const pickupNotification = {
        donationId:donationId,
        type:"donation",
        message: `Your food was delivered successfully. Thank you for your donation! ❤`,
        read: false,
        createdAt: Date.now(),
      };
      await push(ref(db, `notifications/donors/${donorId}`), pickupNotification);
      // 3️⃣ Update donor stats
      const donorRef = ref(db,`donors/${donorId}`);
      const donorSnap = await get(donorRef);
      const donorData = donorSnap.val();
      const currentCount = donorData?.donationCount || 0;
      const currentValue = donorData?.donationValue || 0;
      const newValue = donationData?.quantity || 0;
      await update(donorRef, {
        donationCount: currentCount + 1,
        donationValue: currentValue + newValue,
      });
      // 4️⃣ Prepare Feedback Node
      const feedbackData = {
        [donorId]: {
          feedback: "",
          rating: null,
          status: "pending"
        },
        [volunteerId]: {
          feedback: "",
          rating: null,
          status: "pending"
        }
      };
      const feedbackRef = ref(db, `donation_feedback/${donationId}`);
      await set(feedbackRef, feedbackData);
      Swal.fire({
        title: 'Success!',
        text: 'Donation marked as Completed ✅ & feedback section ready!',
        icon: 'success',
        timer: 4000, // 4 seconds
        timerProgressBar: true,
        showConfirmButton: false // hides the OK button
      });
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Donation not found ❌',
        icon: 'error',
        timer: 4000, // 4 seconds
        timerProgressBar: true,
        showConfirmButton: false
      });
    }
  };    
  // Open map modal
  const openModal = (donation) => {
    setSelectedDonor(donation);
    setModalIsOpen(true);
  };
  // Close modal
  const closeModal = () => {
    setSelectedDonor(null);
    setModalIsOpen(false);
  };
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Available Donations</h2>
      <div className="mb-4">
  <label className="font-semibold mr-2">📅 Filter by Date:</label>
  <input
    type="date"
    value={filterDate}
    onChange={(e) => setFilterDate(e.target.value)}
    className="border rounded px-2 py-1"
  />
</div>
      {availableDonations.length > 0 ? (
        availableDonations
        .filter(donation => {
          if (!filterDate) return true;
          return donation.date === filterDate;
        })
        .map((donation) => (      
          <div
            key={donation.id}
            className={`w-full sm:w-[45%] lg:w-[30%] p-4 border rounded shadow-md transition-colors duration-300 ${
              donation.id === fadedHighlight
                ? "bg-yellow-100 border-l-4 border-yellow-500"
                : "bg-white"
            }`}
          >
            <h3 className="text-xl font-bold">{donation.foodType}</h3>
            <p><strong>Quantity:</strong> {donation.quantity}</p>
            <p><strong>Pickup Location:</strong> {donation.pickupLocation}</p>
            <p><strong>Available Until:</strong> {donation.date} {donation.time}</p>
            {donation.status === 'Pending' && (
              <button
              onClick={() => acceptDonation(donation.id)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 mt-2 w-full"
            >
              ✅ Accept
            </button>
            )}
            {donation.status === 'Accepted' && (
              <button onClick={() => markAsPickedUp(donation.id)}
              className="bg-violet-500 text-white px-4 py-2 rounded-lg hover:bg-violet-600 mt-2 w-full">
              📦 Mark as Picked Up
            </button>
            )}
            {(donation.status === 'Picked Up'||donation.status==='Delivered') && (
              <button onClick={() => delivered(donation.id)}
              className="bg-violet-500 text-white px-4 py-2 rounded-lg hover:bg-violet-600 mt-2 w-full">
              Delivered
            </button>
            )}
            {donation.status === 'Completed' && (
              <span className="text-green-500 font-semibold">✅ Completed</span>
            )}
            {donation.status !== 'Completed' && (
            <button
              onClick={() => openModal(donation)}
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 w-full"
            >
              View on Map 📍
            </button>
            )}
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500">No food donations available at the moment.</p>
      )}
      {/* Map Modal */}
      <Modal
        isOpen={modalIsOpen}
        contentLabel="Request Location"
        className="bg-white p-5 rounded-lg shadow-xl w-4/5 mx-auto mt-20"
        overlayClassName="fixed inset-0 bg-opacity-30 backdrop-blur-md flex items-center justify-center"
      >
        <div className="relative w-full">
          <button 
            onClick={closeModal} 
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

export default FoodAvailable;