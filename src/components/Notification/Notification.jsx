import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCheck, faCheckDouble } from "@fortawesome/free-solid-svg-icons";
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  limit,
  updateDoc,
  doc,
  arrayUnion,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import Swal from "sweetalert2";
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from "../../services/notificationService";
import "./Notification.css";

export const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const currentUser = JSON.parse(sessionStorage.getItem("userData"));

  useEffect(() => {
    if (!currentUser?.uid) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("recipientId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allNotifications = [];
      let unread = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        allNotifications.push({
          id: doc.id,
          ...data
        });
        if (!data.read) unread++;
      });

      setNotifications(allNotifications);
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleAcceptRequest = async (notificationId, fromUserId) => {
    try {
      const currentUserRef = doc(db, 'users', currentUser.uid);
      const targetUserRef = doc(db, 'users', fromUserId);

      await updateDoc(currentUserRef, {
        followers: arrayUnion(fromUserId),
      });
      await updateDoc(targetUserRef, {
        following: arrayUnion(currentUser.uid),
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

  const handleSingleRead = async (notificationId) => {
    await markNotificationAsRead(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => prev - 1);
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllNotificationsAsRead(currentUser.uid);
    if (success) {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  return (
    <div className="notification-container">
      <div 
        className="notification-icon-container"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <FontAwesomeIcon icon={faBell} className="notification-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>New Actions🫣</h4>
            {notifications.length > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="mark-all-read-btn"
              >
                <FontAwesomeIcon icon={faCheckDouble} /> Bye bye all 👋🏼
              </button>
            )}
          </div>

          {notifications.length > 0 ? (
            <div className="notification-list">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                >
                  <div className="notification-content">
                    <img
                      src={notification.profilePic || "https://via.placeholder.com/40"}
                      alt="User Profile"
                      className="notification-user-pic"
                    />
                    <p>{notification.message}</p>
                    <small>
                      {new Date(notification.createdAt?.seconds * 1000).toLocaleString()}
                    </small>
                  </div>
                  
                  {notification.type === "follow-request" ? (
                    <div className="notification-actions">
                      <button 
                        className="button-notif" 
                        onClick={() => handleAcceptRequest(notification.id, notification.from)}
                      >
                        Accept
                      </button>
                      <button 
                        className="button-notif" 
                        onClick={() => handleDeclineRequest(notification.id)}
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="mark-read-btn"
                      onClick={() => handleSingleRead(notification.id)}
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="notification-empty">Pretty quiet here...</div>
          )}
        </div>
      )}
    </div>
  );
};
