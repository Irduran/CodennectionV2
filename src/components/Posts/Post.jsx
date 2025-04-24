import React, { useState, useEffect, useRef } from "react";
import {
  doc,
  updateDoc,
  arrayUnion,
  increment,
  getDoc,
  addDoc,
  arrayRemove,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import "./Post.css";
import blankProfile from "../../assets/blank-profile-picture.svg";
import duck from "../../assets/duck.svg";
import share from "../../assets/share.svg";
import CommentSection from "../Comments/CommentSection";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { sendNotification } from "../../services/notificationService";

const Post = ({
  id,
  username,
  userId,
  profilePic,
  time,
  text,
  media = [],
  quacks = 0,
  sharedBy,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onChangeEdit,
  onPostShared
}) => {
  const currentUser = JSON.parse(sessionStorage.getItem("userData"));
  const [showOptions, setShowOptions] = useState(false);
  const [liked, setLiked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [currentQuacks, setCurrentQuacks] = useState(quacks);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const optionsRef = useRef(null);

  useEffect(() => {
    const checkLike = async () => {
      const postRef = doc(db, "posts", id);
      const postSnap = await getDoc(postRef);
      const data = postSnap.data();
      if (data?.quackedBy?.includes(currentUser?.uid)) {
        setLiked(true);
      }
    };
    checkLike();
  }, [id, currentUser?.uid]);

  useEffect(() => {
    const checkOwner = async () => {
      const postRef = doc(db, "posts", id);
      const postSnap = await getDoc(postRef);
      const data = postSnap.data();
      if (data?.userId === currentUser?.uid) {
        setIsOwner(true);
      }
    };
    checkOwner();
  }, [id, currentUser?.uid]);

  // Detecta clics fuera del menú
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptions]);

  const toggleOptions = () => setShowOptions(!showOptions);

  const toggleLike = async () => {
    if (!currentUser) return;
  
    const postRef = doc(db, "posts", id);
  
    try {
      // Primero obtenemos los datos actuales del post
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) return;
  
      const postData = postSnap.data();
  
      if (liked) {
        // Quitar quack
        await updateDoc(postRef, {
          quacks: increment(-1),
          quackedBy: arrayRemove(currentUser.uid),
        });
        setLiked(false);
        setCurrentQuacks((prev) => prev - 1);
      } else {
        // Añadir quack
        await updateDoc(postRef, {
          quacks: increment(1),
          quackedBy: arrayUnion(currentUser.uid),
        });
        setLiked(true);
        setCurrentQuacks((prev) => prev + 1);
  
        // Enviar notificación SOLO si no es el propio autor
        if (postData.userId !== currentUser.uid) {
          const notificationSent = await sendNotification({
            recipientId: postData.userId,
            senderId: currentUser.uid,
            senderName: currentUser.nombre,
            type: 'quack',
            postId: id
          });
  
          if (!notificationSent) {
            console.warn("Failed to send quack notification");
          }
        }
      }
    } catch (error) {
      console.error("Error in toggleLike:", error);
      // Aquí podrías mostrar un mensaje al usuario
    }
  };

  const handleShare = async () => {
    if (!currentUser) return;
  
    const postRef = doc(db, "posts", id); 
    const postSnap = await getDoc(postRef); 
  
    if (postSnap.exists()) {
      const originalPost = postSnap.data();
  
      await addDoc(collection(db, "posts"), {
        ...originalPost, 
        userId: currentUser.uid,  
        quacks: 0,  
        createdAt: serverTimestamp(),
        quackedBy: [],  
        sharedBy: currentUser.nombre,  
      });
  
      Swal.fire({
        icon: "success",
        title: "Post shared!",
        text: "Your post has been shared successfully!",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        if (onPostShared) {
          onPostShared();
        }
      });
      
    }
  };
  const handleReport = async () => {
    if (!currentUser) return;
  
    const { value: reason } = await Swal.fire({
      title: "Report Post",
      input: "text",
      inputLabel: "Reason for report",
      inputPlaceholder: "Enter your reason...",
      showCancelButton: true,
    });
  
    if (reason) {
      try {
        const reportRef = collection(db, "posts", id, "reports");
        await addDoc(reportRef, {
          reason,
          reportedBy: currentUser.uid,
          reportedAt: serverTimestamp(),
        });
  
        Swal.fire({
          icon: "success",
          title: "Reported!",
          text: "Thank you for reporting this post.",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error reporting post:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "There was a problem reporting this post.",
        });
      }
    }
  };

  const handlePrev = () => {
    setCurrentMediaIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentMediaIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };
  
  return (
    <div className="post-container">
      <div className="post-header">
        <div className="profile-picture-container">
          <img
            src={profilePic || blankProfile}
            alt="Profile"
          />
        </div>
        <div className="post-info">
          <Link
            to={userId === currentUser?.uid ? '/profile' : `/user/${userId}`}
            className="username"
          >
            {username}
          </Link>
          <div className="time">{time}</div>
          {sharedBy && (
          <div className="shared-label">
            Shared by {sharedBy}
          </div>
        )}
        </div>
        <button className="share-button" onClick={handleShare}>
          <img src={share} alt="share" />
        </button>
        <div className="post-options" onClick={toggleOptions}>⋯</div>
        {showOptions && (
          <div className="options-menu" ref={optionsRef}>
            {isOwner && (
              <>
                {isEditing ? (
                  <div className="option" onClick={onSave}>Save✨</div>
                ) : (
                  <div className="option" onClick={onEdit}>Edit🖋️</div>
                )}
                <div className="option" onClick={onDelete}>Delete❌</div>
              </>
            )}
            <div className="option" onClick={handleReport}>Report👀</div>
          </div>
        )}
      </div>

      <div className="post-content">
        {isEditing ? (
          <textarea
            className="edit-textarea"
            value={text}
            onChange={onChangeEdit}
          />
        ) : (
          <p>{text}</p>
        )}

{media.length > 0 && (
          <div className="media-carousel">
            <div className="carousel-wrapper">
              {media.length > 1 && (
                <>
                  <div className="carousel-nav left" onClick={handlePrev}>
                    ❮
                  </div>
                  <div className="carousel-nav right" onClick={handleNext}>
                    ❯
                  </div>
                </>
              )}
              <div className="carousel-container">
                {media[currentMediaIndex].type === "image" ? (
                  <img
                    src={media[currentMediaIndex].url}
                    alt="Post media"
                    className="carousel-media"
                  />
                ) : media[currentMediaIndex].type === "video" ? (
                  <video controls className="carousel-media">
                    <source
                      src={media[currentMediaIndex].url}
                      type="video/mp4"
                    />
                    Your browser don't support this file 😢
                  </video>
                ) : (
                  <div
                    className="document-preview"
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      borderRadius: "12px",
                      background: "#2b2b2b",
                      color: "white",
                      maxWidth: "100%",
                    }}
                  >
                    <div className="doc-icon">
                      {media[currentMediaIndex].type.includes("pdf")
                        ? "📄"
                        : media[currentMediaIndex].type.includes("zip")
                        ? "📦"
                        : "📁"}
                    </div>
                    <div className="doc-name">Check This File!📄</div>
                    <a
                      href={media[currentMediaIndex].url.replace(
                        "/upload/",
                        "/upload/fl_attachment/"
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="doc-download"
                      style={{
                        background: "#a985fc",
                        color: "white",
                        padding: "10px 15px",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: "bold",
                        marginTop: "8px",
                        display: "inline-block",
                      }}
                    >
                      Download ⬇️
                    </a>
                  </div>
                )}
              </div>
            </div>
            {media.length > 1 && (
              <div className="carousel-dots">
                {media.map((_, index) => (
                  <span
                    key={index}
                    className={`dot ${
                      index === currentMediaIndex ? "active" : ""
                    }`}
                    onClick={() => setCurrentMediaIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="post-footer">
        <img
          src={duck}
          alt="duck"
          className={`icon ${liked ? "liked" : "unliked"}`}
          onClick={toggleLike}
        />
        <div className="actions">
          <div className="action">{currentQuacks} Quacks!</div>
          <div className="action"> Comments📨</div>
        </div>
      </div>
      <CommentSection postId={id} />
    </div>
  );
};

export default Post;
