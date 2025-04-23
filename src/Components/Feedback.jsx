import React, { useEffect, useState } from 'react';
import { getDatabase, ref, get, child } from "firebase/database";

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true); 

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const db = getDatabase();
      const dbRef = ref(db);
  
      const feedbackTypes = ["donation_feedback", "request_feedback"];
      const roles = ["donor", "recipient", "volunteer"];
  
      const allFeedbacks = [];
  
      for (let type of feedbackTypes) {
        const feedbackSnap = await get(child(dbRef, type));
        const feedbackData = feedbackSnap.val();
  
        if (feedbackData) {
          for (const feedbackId in feedbackData) {
            const userFeedbacks = feedbackData[feedbackId]; // Each donation/request ID
  
            for (const uid in userFeedbacks) {
              const feedback = userFeedbacks[uid];
  
              if (feedback.status !== "submitted") continue;
  
              // Get user info
              let userData = null;
              for (let role of roles) {
                const userSnap = await get(child(dbRef, `${role}/${uid}`));
                if (userSnap.exists()) {
                  userData = userSnap.val();
                  break;
                }
              }
              allFeedbacks.push({
                uid,
                type: type.replace("_feedback", ""), // donation / request
                rating: feedback.rating,
                feedback: feedback.feedback,
                status: feedback.status,
                timestamp: feedback.timestamp,
                user: {
                  name: userData?.username || "Anonymous",
                  role: userData?.role || "User",
                  profilePic: userData?.profilePic || "https://via.placeholder.com/100",
                },
              });
            }
          }
        }
      }
  
      const sortedFeedbacks = allFeedbacks.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
  
      setFeedbacks(sortedFeedbacks);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }
    finally {
      setLoading(false); // Stop loading
    }
  };    
  useEffect(() => {
    fetchFeedbacks();
  }, []);
  

  return (
    <section className="py-16 px-6 sm:px-10 bg-gray-100">
  <h2 className="text-4xl font-bold text-center mb-10 bg-gray-800 text-white py-4 px-6 inline-block rounded-lg">
    What Our Users Are Saying…
  </h2>

  {loading ? (
    <div className="text-center text-xl font-semibold text-gray-600 animate-pulse">
      Loading feedbacks...
    </div>
  ) : feedbacks.length === 0 ? (
    <div className="text-center text-lg text-gray-500">No feedbacks found.</div>
  ) :(
    <div className="flex gap-6 py-2 px-1 snap-x snap-mandatory overflow-x-auto scrollbar-hide">
  {feedbacks.map((fb, index) => (
    <div
      key={index}
      className="w-[90%] sm:min-w-[350px] sm:w-auto p-6 bg-white border border-gray-200 rounded-2xl shadow-lg transition duration-300 hover:shadow-xl flex-shrink-0 snap-start mx-auto"
    >       
      <div className="flex items-center gap-6 mb-4">
        <img
          src={fb.user.profilePic}
          alt="Profile"
          className="w-14 h-14 rounded-full object-cover border-2 border-gray-300"
        />
        <div>
          <h3 className="text-3xl mb-2 font-bold text-gray-800">{fb.user.name}</h3>
          <span
            className={`text-sm font-medium px-2 py-1 rounded-full ${
              fb.user.role === "Donor"
                ? "bg-blue-100 text-blue-600"
                : fb.user.role === "Recipient"
                ? "bg-green-100 text-green-600"
                : "bg-purple-100 text-purple-600"
            }`}
          >
            {fb.user.role}
          </span>
        </div>
      </div>

      <p className="text-gray-700 mb-4 italic text-lg line-clamp-4">"{fb.feedback}"</p>

      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-3xl ${star <= fb.rating ? "text-yellow-400" : "text-gray-300"}`}
          >
            ★
          </span>
        ))}
      </div>

      <div className="mt-2 text-sm text-gray-500">
        {new Date(fb.timestamp).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </div>
    </div>
  ))}
</div>
  )}
</section>
  );  
};

export default Feedback;
