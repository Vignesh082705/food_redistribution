import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendEmailVerification, signOut, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth, database } from '../../firebase';
import { ref, get } from 'firebase/database';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const emailref=ref(database,"emails");
        const snapshot=await get(emailref);
        if(snapshot.exists()){
            const emails=Object.values(snapshot.val())
            for(var i=0;i<emails.length;i++){
                if(email === emails[i]){
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    const user=userCredential.user;
                    const uid=user.emailVerified;

                    
                    //const signInMethods = await fetchSignInMethodsForEmail(auth, "ashprak538@gmail.com");
                    console.log(userCredential.user.emailVerified);
                    await signOut(auth);
                    
                    if (!userCredential.user.emailVerified) {
                        
                        if (!uid) {
                            setError("Email not verified! Please check your inbox.");
                            return;
                            }
                    } else {
                        const userCredential = await signInWithEmailAndPassword(auth, email, password);
                        const user=userCredential.user;
                        navigate('/profile');
                        window.location.reload();
                    }
                }
                else
                    setError("Invalid Email or Password !");
            }
        }

        
        
    } catch (error) {
        setError("Invalid email or password..!"+error);
    }

    //     const user = userCredential.user;
    //   // Check if email is verified
    //   if (!user.emailVerified) {
    //     setError("Email not verified! Please check your inbox.");
    //     await sendEmailVerification(user); // Resend verification email
    //     await signOut(auth);
    //     alert("A new verification email has been sent!");
    //     return;
    //   }
    //   await checkUserRole(user.uid);
    // } catch (err) {
    //   setError('Invalid email or password..!');
    //}
  };

  // Role Checking Function
  const checkUserRole = async (uid) => {
    const roles = ['donor', 'recipient', 'volunteer'];

    for (let role of roles) {
      const roleRef = ref(database, `${role}/${uid}`);
      const snapshot = await get(roleRef);
      if (snapshot.exists()) {
        console.log(`User role is: ${snapshot.val().role}`);
        localStorage.setItem('userRole', role); // Store role in local storage

        // Navigate based on role
       navigate('/profile');
      window.location.reload();
      }
    }

    console.log('No role found for the user');
    setError('No role found. Please contact support.');
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>
        
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-600">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="">
            <label className="block text-gray-600">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="py-4 ml-60">
          <Link to="/forgot-password" className="text-blue-500">Forgot Password?</Link>
        </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition duration-200"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
