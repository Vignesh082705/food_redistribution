import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

const FeedBack = ({ onClose, onSubmit, visible, className, overlayClassName }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [visible]);

  if (!visible) return null;

  const handleSubmit = () => {
    if (!rating || !feedback) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete!",
        text: "Please fill in both rating and feedback.",
      });
      return;
    }
  
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to submit your feedback?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Submit",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        onSubmit({ rating, feedback });
  
        Swal.fire({
          icon: "success",
          title: "Submitted!",
          text: "Thanks for your valuable feedback!",
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
          didClose: () => {
            onClose();
          },
        });
      }
    });
  };  

  const handleNever = async () => {
    const result = await Swal.fire({
      title: "Reject Feedback?",
      text: "You won't be asked for feedback again.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Never Ask",
    });
      try {
        onSubmit({ status: "rejected" });
        onClose();
      } catch (err) {
        Swal.fire("Error", "Could not update status. Try again!", "error");
      }
  };

  const handleLater = async () => {
    const result = await Swal.fire({
      title: "Come again?",
      text: "We'll remind you later.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Yes, Later",
    });
  
    if (result.isConfirmed) {
      onClose(); // ✅ Only close when user confirms
    }
  };  

  return (
    <div
      className={
        overlayClassName ||
        "fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50"
      }
    >
      <div className={className || "bg-white p-6 rounded-2xl shadow-lg w-96"}>
        <h2 className="text-xl font-bold mb-4">We'd love your feedback!</h2>

        <label className="block mb-2">Rating:</label>
        <div className="flex mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-2xl ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
            >
              ★
            </button>
          ))}
        </div>

        <label className="block mb-2">Feedback:</label>
        <textarea
          className="w-full border p-2 rounded mb-4"
          rows={3}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button onClick={handleLater} className="bg-gray-300 px-4 py-2 rounded">
            Later
          </button>
          <button
            onClick={handleNever}
            className="bg-red-400 text-white px-4 py-2 rounded"
          >
            Never
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedBack;
