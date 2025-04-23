import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { formatDistanceToNow } from "date-fns"; // ✅ For time formatting
import { Bell, CheckCircle } from "lucide-react"; // ✅ Icons
import { useNavigate } from "react-router-dom";


function VolunteerNotification() {
    const navigate = useNavigate();
    const [userId, setUserId] = useState(null);
    const [notifications, setNotifications] = useState([]);

    // Fetch logged-in user ID
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                setUserId(null);
            }
        });
        return () => unsubscribe();
    }, []);

    // Fetch recipient notifications
    useEffect(() => {
        if (!userId) return;
    
        const notificationsRef = ref(database, `notifications/volunteers/${userId}`);
    
        const unsubscribe = onValue(notificationsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const notificationsList = Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key],
                }));
    
                const sortedNotifications = notificationsList.sort(
                    (a, b) => b.createdAt - a.createdAt
                );
    
                setNotifications(sortedNotifications);
            } else {
                setNotifications([]);
            }
        });
    
        return () => unsubscribe();
    }, [userId]);    

    const handleNotificationClick = (notification) => {
        if (notification.type === "donation" && notification.donationId && notification.role!=="volunteer") {
            navigate(`/tasks?highlight=${notification.donationId}`);
        } else if (notification.type === "request" && notification.requestId) {
            navigate(`/tasks?highlight=${notification.requestId}`);
        }else if (notification.type === "donation" && notification.donationId && notification.role==="volunteer") {
            navigate(`/food-available?highlight=${notification.donationId}`);
        }
    };

    return (
        <div className="max-w-md mx-auto p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-blue-500" /> Notifications
            </h2>

            {notifications.length === 0 ? (
                <p className="text-gray-500 text-center">No new notifications</p>
            ) : (
                <ul className="space-y-3">
                    {notifications.map((notification) => (
                        <li
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`cursor-pointer p-3 rounded-lg shadow-md flex items-center justify-between ${
                          notification.read ? "bg-gray-100" : "bg-blue-100 border-l-4 border-blue-500"
                        }`}
                      >
                            <div>
                                <p className="text-sm font-medium">{notification.message}</p>
                                <p className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                            {!notification.read && (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default VolunteerNotification;
