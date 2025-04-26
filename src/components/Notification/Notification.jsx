import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCheck, faCheckDouble } from "@fortawesome/free-solid-svg-icons";
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  limit,
  updateDoc,
  doc,
  arrayUnion,
  deleteDoc,
  orderBy,
  getDocs
} from "firebase/firestore";
import { db } from "../../firebase";
import Swal from "sweetalert2";
import { 
  markNotificationAsRead
} from "../../services/notificationService";
import "./Notification.css";

export const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const currentUser = JSON.parse(sessionStorage.getItem("userData"));

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", currentUser.uid),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allNotifications = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        allNotifications.push({
          id: doc.id,
          ...data
        });
      });

      allNotifications.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });

      setNotifications(allNotifications);
      const unread = allNotifications.filter(n => !n.read).length;
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

  const handleSingleRead = (id) => {
    toggleNotificationSelection(id);
  };

  const toggleNotificationSelection = (id) => {
    setSelectedNotifications(prev =>
      prev.includes(id)
        ? prev.filter(n => n !== id)
        : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    try {
      const deletions = selectedNotifications.map(id =>
        deleteDoc(doc(db, "notifications", id))
      );
      await Promise.all(deletions);
      setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
      setSelectedNotifications([]);
    } catch (error) {
      console.error("Error deleting selected notifications:", error);
      Swal.fire("Error", "Failed to delete selected notifications.", "error");
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
                onClick={handleDeleteSelected}
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
                      src={notification.profilePic}
                      alt="User Profile"
                      className="notification-user-pic"
                    />
                    <p>
                      {notification.type === "follow_request"
                        ? `${notification.message} (Solicitud de seguimiento)`
                        : notification.message}
                    </p>
                    <small>
                      {new Date(notification.createdAt?.seconds * 1000).toLocaleString()}
                    </small>
                  </div>

                  {notification.type === "follow_request" ? (
                    <div className="notification-actions">
                      <button 
                        className="button-notif" 
                        onClick={() => handleAcceptRequest(notification.id, notification.senderId)}
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
                      <FontAwesomeIcon 
                        icon={faCheck} 
                        style={{ color: selectedNotifications.includes(notification.id) ? 'green' : 'gray' }} 
                      />
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
