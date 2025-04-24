import { 
  addDoc, 
  collection, 
  serverTimestamp,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  writeBatch,
  orderBy,
  onSnapshot,
  limit
} from "firebase/firestore";
import { db } from "../firebase";

export const sendNotification = async ({ 
  recipientId, 
  senderId, 
  senderName, 
  type, 
  postId, 
  commentId = null 
}) => {
  try {
    let message = '';
    
    // Mensajes personalizados para cada tipo
    const messages = {
      'comment': `${senderName} comment your post`,
      'quack': `${senderName} quack your post`,
      'reply': `${senderName} reply your comment`,
    };

    message = messages[type] || `${senderName} watch your post`;

    const notificationRef = await addDoc(collection(db, "notifications"), {
      recipientId,
      senderId,
      senderName,
      type,
      postId,
      commentId,
      message,
      read: false,
      createdAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    // Necesitamos primero obtener las notificaciones no leídas
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId),
      where("read", "==", false)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.forEach((doc) => {
      const notificationRef = doc.ref;
      batch.update(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
};
