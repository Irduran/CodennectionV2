import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { collection, query, where, onSnapshot, updateDoc, doc, arrayUnion, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import Swal from "sweetalert2";
import "./Notification.css";

export const Notification = ({ currentUserId }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);  

  useEffect(() => {
    if (!currentUserId) return;

    const q = query(
      collection(db, "notifications"),
      where("to", "==", currentUserId),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifData);
    });

    return () => unsubscribe();
  }, [currentUserId]);


  const handleAcceptRequest = async (notificationId, fromUserId) => {
    try {

      const currentUserRef = doc(db, 'users', currentUserId);
      const targetUserRef = doc(db, 'users', fromUserId);


      await updateDoc(currentUserRef, {
        followers: arrayUnion(fromUserId), 
      });
      await updateDoc(targetUserRef, {
        following: arrayUnion(currentUserId),
      });

      Swal.fire("Success!", "You have accepted the request.", "success");
      await deleteDoc(doc(db, "notifications", notificationId));
    } catch (error) {
      console.error("Error accepting request:", error);
      Swal.fire("Error", "Failed to accept the request.", "error");
    }
  };


  const handleDeclineRequest = async (notificationId) => {
    try {

      await deleteDoc(doc(db, "notifications", notificationId));

      Swal.fire("Success!", "You have declined the request.", "success");
    } catch (error) {
      console.error("Error declining request:", error);
      Swal.fire("Error", "Failed to decline the request.", "error");
    }
  };


  const toggleDropdown = () => {
    setShowDropdown(prevState => !prevState);
  };

return (
  <div className="topbar-notification-wrapper">
  <div className="topbar-notification-round">
    <FontAwesomeIcon
      icon={faBell}
      className="topbar-notification"
      onClick={toggleDropdown}
    />
  </div>

  {showDropdown && notifications.length > 0 && (
    <div className="notification-dropdown">
      {notifications.map((notification) => (
        <div key={notification.id} className="notification-item">
          <div className="notification-header">
            <img
              src={notification.profilePic || "https://via.placeholder.com/40"}
              alt="User Profile"
              className="notification-user-pic"
            />
            <p className="notification-message">{notification.message}</p>
          </div>
          <div className="notification-actions">
            <button className="button-notif" onClick={() => handleAcceptRequest(notification.id, notification.from)}>
              Accept
            </button>
            <button className="button-notif" onClick={() => handleDeclineRequest(notification.id)}>
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
);
};


