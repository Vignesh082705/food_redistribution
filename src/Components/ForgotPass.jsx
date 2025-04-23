import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate, Link } from 'react-router-dom';

const ForgotPass = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset link sent to your email.");
      navigate('/login');
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  };

  return (
  <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
      <div className="mb-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>
      <button
        onClick={handleResetPassword}
        className="bg-blue-500 text-white px-4 py-2 ml-28 mb-4 rounded"
      >
        Reset Password
      </button>
      {message && <p className="mt-4">{message}</p>}
    </div>
    </div>
  );
};

export default ForgotPass;
