import React, { useState, useEffect, useRef } from "react";
import {
  doc,
  updateDoc,
  arrayUnion,
  increment,
  getDoc,
  arrayRemove
} from "firebase/firestore";
import { db } from "../../firebase";
import "./PostUser.css";
import blankProfile from "../../assets/blank-profile-picture.svg";
import duck from "../../assets/duck.svg";
import CommentSection from "../Comments/CommentSection";

const PostUser = ({
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
}) => {
  const currentUser = JSON.parse(sessionStorage.getItem("userData"));
  const [showOptions, setShowOptions] = useState(false);
  const [liked, setLiked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [currentQuacks, setCurrentQuacks] = useState(quacks);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const optionsRef = useRef();

  useEffect(() => {
    // Verifica si el usuario ya dio like
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
    if (userId === currentUser?.uid) {
      setIsOwner(true);
    }
  }, [userId, currentUser?.uid]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptions]);

  const toggleOptions = () => setShowOptions(!showOptions);

  const toggleLike = async () => {
    if (!currentUser) return;

    const postRef = doc(db, "posts", id);

    if (liked) {
      await updateDoc(postRef, {
        quacks: increment(-1),
        quackedBy: arrayRemove(currentUser.uid),
      });
      setLiked(false);
      setCurrentQuacks((prev) => prev - 1);
    } else {
      await updateDoc(postRef, {
        quacks: increment(1),
        quackedBy: arrayUnion(currentUser.uid),
      });
      setLiked(true);
      setCurrentQuacks((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentMediaIndex((prevIndex) =>
      prevIndex === 0 ? media.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentMediaIndex((prevIndex) =>
      prevIndex === media.length - 1 ? 0 : prevIndex + 1
    );
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
          <div className="username">{username}</div>
          <div className="time">{time}</div>
          {sharedBy && (
          <div className="shared-label">
            Shared by {sharedBy}
          </div>
        )}
        </div>
        <div className="post-options" onClick={toggleOptions}>...</div>
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
              <div className="option">Report👀</div>
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
                  <video
                    controls
                    className="carousel-media"
                  >
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

export default PostUser;
