import React, { useEffect, useState } from "react";
import { Link, Scripts, useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get, update, onValue, onChildChanged  } from "firebase/database";
import { Bell } from "lucide-react";
import Logo from "../assets/logo.jpg";
import { app } from "../firebase";
import Swal from "sweetalert2";

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const auth = getAuth(app);
  const database = getDatabase();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        await fetchUserData(user.uid);
        if (role) fetchNotifications(user.uid, role);
      } else {
        setIsLoggedIn(false);
        setRole(null);
        setProfilePic(null);
        setUnreadNotifications([]);
      }
    });
    return () => unsubscribe();
  }, [role]);
  const closeMobileNav = () => {
    setMobileNavOpen(false);
  };
  const toggleMobileNav = () => {
    setMobileNavOpen(!isMobileNavOpen);
  };

  const fetchUserData = async (uid) => {
    const roles = ["donor", "recipient", "volunteer"];
    for (let r of roles) {
      const userRef = ref(database, `${r}/${uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        setRole(r);
        setProfilePic(snapshot.val().profilePic || null);
        break;
      }
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "⚠️ Are you sure you want to log out?",
      text: "You will need to log in again to access your account.",
      icon: "warning",
      showCancelButton: true, // Show a Cancel button
      confirmButtonText: "Yes, log out",
      cancelButtonText: "No, stay logged in",
      backdrop: `
        rgba(255, 165, 0, 0.3)  // Orange-yellow backdrop for warning
        center/cover no-repeat
      `,
      customClass: {
        popup: "swal-wide",
      },
    });
  
    // If the user confirms the action (clicks "Yes, log out"), proceed with logout
    if (result.isConfirmed) {
      await signOut(auth); // Sign out from authentication
      navigate("/login");  // Navigate to the login page
    }
  };

  const roleLinks = {
    donor: [
      { path: "/add-donation", label: "Add Donation" },
      { path: "/my-donations", label: "My Donations" },
      { path: "/requests", label: "Requests" },
    ],
    recipient: [
      { path: "/find-food", label: "Find Food" },
      { path:"/request-food", label:"Request Food"},
      { path: "/my-requests", label: "My Requests" },
    ],
    volunteer: [
      { path: "/tasks", label: "Tasks" },
      { path: "/map/:taskId", label: "Map" },
      { path: "/food-available", label: "Food Available" },
    ],
  };
  
  const fetchNotifications = (userId, userRole) => {
    let path = `notifications/${userRole}s/${userId}`;
    const notificationsRef = ref(database, path);
  
    onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const notificationsList = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((notif) => !notif.read); // 🔴 Unread filter
  
        setUnreadNotifications(notificationsList);
      } else {
        setUnreadNotifications([]);
      }
    });
  
    // 🔹 Listen for changes in read status
    onChildChanged(notificationsRef, (snapshot) => {
      const updatedNotif = snapshot.val();
      if (updatedNotif.read) {
        setUnreadNotifications((prev) =>
          prev.filter((notif) => notif.id !== snapshot.key)
        );
      }
    });
  };
  
  const handleAllNotificationsClick = async () => {
    setIsNotificationsOpen((prev) => !prev);
    if (!role || !auth.currentUser) return;
  
    const userId = auth.currentUser.uid;
    const notificationsRef = ref(database, `notifications/${role}s/${userId}`);
  
    try {
      const snapshot = await get(notificationsRef);
      if (snapshot.exists()) {
        const updates = {};
        Object.keys(snapshot.val()).forEach((notifId) => {
          updates[`${notifId}/read`] = true;
        });
  
        await update(notificationsRef, updates);
        setUnreadNotifications([]); // Clear local state
  
        // ✅ Ensure navigation happens after update
        setTimeout(() => {
          navigate(`/notifications-${role}`);
        }, 300);
      } else {
        navigate(`/notifications-${role}`); // Even if no unread notifications, navigate
      }
    } catch (error) {
      console.error("Error updating notifications:", error);
    }
  };
    
  
  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-gray-800 text-white shadow-md px-3 lg:px-8 py-4 flex items-center justify-between ">
      {/* Logo */}
      <>
      {isLoggedIn?(
      <div className="flex items-center gap-2 ">
        <img src={Logo} alt="logo" className="md:h-12 w-auto h-10 rounded-full" />
        <h1 className="text-[#E195AB] font-poppins text-xl md:text-[26px] font-bold hover:text-[#DE3163] transition-colors duration-300">
          FOOD REDISTRIBUTION
        </h1>
      </div>):(
        <Link to="/" className="flex items-center gap-2" onClick={closeMobileNav}>
        <img src={Logo} alt="logo" className="md:h-12 w-auto h-10 rounded-full" />
        <h1 className="text-[#E195AB] font-poppins text-xl md:text-[26px] font-bold hover:text-[#DE3163] transition-colors duration-300">
          FOOD REDISTRIBUTION
        </h1>
      </Link>
      )}
      </>
      
      {/* Navigation */}
      <nav className="hidden lg:flex items-center ml-auto gap-8 text-[#E195AB] font-medium md:text-[18px] text-[14px]">
  {isLoggedIn && role ? (
    roleLinks[role].map(({ path, label }) => {
      const isActive = location.pathname.startsWith(path.split(":")[0]);
      const linkTo = path.includes(":") ? path.split(":")[0] : path;
      return(
      <Link 
        key={path} 
        to={linkTo} 
        className={`relative group transition-colors duration-300 ${isActive ? 'text-[#DE3163]' : 'hover:text-[#DE3163]'}`}
      >
        {label}
        <span className={`absolute left-1/2 -bottom-0.5 h-0.5 bg-[#DE3163] transition-all duration-500 transform -translate-x-1/2 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
      </Link>
    );})
  ) : (
    //underline effect
    ["/donate", "/request", "/volunteer", "/contact", "/login"].map((path) => (
      <Link 
        key={path} 
        to={path} 
        className={`relative group transition-colors duration-300 ${location.pathname === path ? 'text-[#DE3163]' : 'hover:text-[#DE3163]'}`}
      >
        {path.replace("/", "").charAt(0).toUpperCase() + path.replace("/", "").slice(1)}
        <span className={`absolute left-1/2 -bottom-0.5 h-0.5 bg-[#DE3163] transition-all duration-500 transform -translate-x-1/2 ${location.pathname === path ?'w-full' : 'w-0 group-hover:w-full'}`}></span>
      </Link>
    ))
  )}
      
        {isLoggedIn && (
          <>
          <div className="flex items-center gap-4 lg:flex">
          <div className="relative flex items-center cursor-pointer" onClick={() => { handleAllNotificationsClick(); closeMobileNav(); }}>
            <Bell size={24} className={`transition-colors duration-300 ${
              location.pathname === "/notifications-recipient" ? 'text-[#DE3163]' : 
              location.pathname === "/notifications-donor" ? 'text-[#DE3163]' : 
              location.pathname === "/notifications-volunteer" ? 'text-[#DE3163]' : 'hover:text-[#DE3163] text-white'
              
            }`}/>
            {unreadNotifications.length > 0 && (
              <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
            )}
          </div>
            {profilePic ? (
                <a href="/profile">
                    <img src={profilePic} alt="Profile" className="w-15 h-15 rounded-full object-cover border"/>
              </a>
            ):(<></>)}
            <button onClick={() => { handleLogout(); closeMobileNav(); }} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">Logout</button>
            </div>
          </>
        )}
      </nav>
      <div className="flex pl-2 items-center gap-3">
      {isLoggedIn && (
  <div className="flex items-center lg:hidden gap-3">
    <div className="relative flex items-center cursor-pointer" onClick={() => { handleAllNotificationsClick(); closeMobileNav(); }}>
    <Bell size={24} className={`transition-colors duration-300 ${
              location.pathname === "/notifications-recipient" ? 'text-[#DE3163]' : 'hover:text-white'
            }`}/>
  {unreadNotifications.length > 0 && (
    <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
  )}
</div>

    {/* Profile Picture */}
    {profilePic ? (
        <div className="w-12">
      <a href="/profile">
        <img src={profilePic} alt="Profile" className="md:w-auto w-11 h-11 rounded-full border object-cover" />
      </a>
      </div>
    ) : (<></>
    )}
  </div>
)}

    <button onClick={toggleMobileNav} className={"lg:hidden focus:outline-none z-50" }>
    <div className="flex flex-col gap-1">
          <span className={`block h-0.5 w-7 bg-white transition-transform duration-300 ${isMobileNavOpen ? "rotate-45 translate-y-1.5" : ""}`}></span>
          <span className={`block h-0.5 w-7 bg-white transition-opacity duration-300 ${isMobileNavOpen ? "opacity-0" : ""}`}></span>
          <span className={`block h-0.5 w-7 bg-white transition-transform duration-300 ${isMobileNavOpen ? "-rotate-45 -translate-y-1.5" : ""}`}></span>
        </div>
    </button>
          </div>

          <nav className={`lg:hidden absolute top-full left-0 w-full bg-gray-800 pb-4 text-center shadow-lg -z-50 
  overflow-hidden transition-all duration-900 ease-in-out origin-top  text-[#E195AB] font-medium md:text-[18px] text-[16px]
  ${isMobileNavOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}>
  {isLoggedIn && role ? (
    <>
    {roleLinks[role].map(({ path, label }) => {
      const isActive = location.pathname.startsWith(path.split(":")[0]);
      const linkTo = path.includes(":") ? path.split(":")[0] : path;
    
      return (
      <Link 
        key={path} 
        to={linkTo} 
        onClick={() => setMobileNavOpen(false)} 
        className="block py-3"
      >
        <span className={`relative inline-block group ${isActive ? 'text-[#DE3163]' : 'hover:text-[#DE3163] group-hover:text-[#DE3163]'}`}>
          {label}
          <span className={`absolute left-1/2 -bottom-0.5 h-0.5 bg-[#DE3163] transition-all duration-500 transform -translate-x-1/2 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
        </span>
      </Link>
    );})}
    <button onClick={() => { handleLogout(); closeMobileNav(); }} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">Logout</button>
    </>
  ) : (
    ["/donate", "/request", "/volunteer", "/contact", "/login"].map((path) => (
      <Link 
        key={path} 
        to={path} 
        onClick={() => setMobileNavOpen(false)} 
        className="block py-3"
      >
        <span className={`relative inline-block group ${location.pathname === path ? 'text-[#DE3163]' : 'text-[#E195AB] group-hover:text-[#DE3163]'}`}>
          {path.replace("/", "").charAt(0).toUpperCase() + path.replace("/", "").slice(1)}
          <span className={`absolute left-1/2 -bottom-0.5 h-0.5 bg-[#DE3163] transition-all duration-500 transform -translate-x-1/2 ${location.pathname === path ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
        </span>
      </Link>
    ))
  )}
      </nav>
    </header>
)
};

export default Header;
