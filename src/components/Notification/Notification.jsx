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
} from "firebase/firestore";
import { db } from "../../firebase";
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

  const handleSingleRead = async (notificationId) => {
    await markNotificationAsRead(notificationId);
    // Actualizar el estado local inmediatamente para mejor experiencia de usuario
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
                  onClick={() => handleSingleRead(notification.id)}
                >
                  <div className="notification-content">
                    <p>{notification.message}</p>
                    <small>
                      {new Date(notification.createdAt?.seconds * 1000).toLocaleString()}
                    </small>
                  </div>
                  <button 
                    className="mark-read-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSingleRead(notification.id);
                    }}
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="notification-empty">Pretty quite here...</div>
          )}
        </div>
      )}
    </div>
  );
};