import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { useParams, useLocation } from "react-router-dom";
import { getDatabase, get, ref } from "firebase/database";
import { auth } from "../../firebase";

const Map = () => {
  const { taskId } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const source = query.get("source"); // 'donation' or 'request'

  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user || !taskId || !source) return;

      const db = getDatabase();

      // --- Donation-based Map ---
      const fetchFromDonation = async () => {
        const donationRef = ref(db, `donations/${taskId}`);
        const snapshot = await get(donationRef);
        const donation = snapshot.val();

        if (!donation) return;

        const recipientId = donation.recipientId;
        const recipientData = donation.recipients?.[recipientId];

        if (
          donation.latitude &&
          donation.longitude &&
          recipientData?.location?.latitude &&
          recipientData?.location?.longitude
        ) {
          setTasks([{
            id: taskId,
            foodType: donation.foodType,
            pickup: [donation.latitude, donation.longitude],
            delivery: [recipientData.location.latitude, recipientData.location.longitude],
          }]);
        }
      };

      // --- Request-based Map ---
      const fetchFromRequest = async () => {
        const requestRef = ref(db, `requests/${taskId}`);
        const snapshot = await get(requestRef);
        const request = snapshot.val();
        console.log(request)
      
        if (!request) return;
      
        const acceptedBy=request.acceptedby;
        const donorStatus = request.donors?.[acceptedBy]?.status;
        const pickupLat = request.donors?.[acceptedBy]?.location?.latitude;
        const pickupLon = request.donors?.[acceptedBy]?.location?.longitude;
        const deliveryLat = request.deliverylocation?.lat;
        const deliveryLon = request.deliverylocation?.lon;
      
        if (
          donorStatus === "Accepted" &&
          pickupLat && pickupLon &&
          deliveryLat && deliveryLon
        ) {
          setTasks([
            {
              id: taskId,
              foodType: "Requested Food",
              pickup: [pickupLat, pickupLon],
              delivery: [deliveryLat, deliveryLon],
            },
          ]);
        }
      };            

      // Switch based on source type
      if (source === 'donation') {
        fetchFromDonation();
      } else if (source === 'request') {
        fetchFromRequest();
      }
    });

    return () => unsubscribe();
  }, [taskId, source]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📍 Your Route Map</h2>
      {tasks.length === 0 ? (
        <p className="text-gray-500">No route available for this task.</p>
      ) : (
        tasks.map((task) => (
          <div key={task.id} className="mb-6 border p-4 rounded shadow">
            <h3 className="font-semibold mb-2">🍱 {task.foodType}</h3>
            <MapContainer center={task.pickup} className="z-40" zoom={13} style={{ height: "400px", width: "100%" }}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={task.pickup}>
                <Popup>📦 Pickup Location</Popup>
              </Marker>
              <Marker position={task.delivery}>
                <Popup>🏠 Delivery Location</Popup>
              </Marker>
              <Polyline positions={[task.pickup, task.delivery]} color="blue" />
            </MapContainer>
          </div>
        ))
      )}
    </div>
  );
};

export default Map;
