import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import Swal from "sweetalert2";
import "./CreatePost.css";

const CreatePost = ({ onPostCreated }) => {
  const [text, setText] = useState("");
  const [media, setMedia] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const userData = JSON.parse(sessionStorage.getItem("userData"));
  const username = userData?.nombre || "User";

  const handleMediaUpload = async (files) => {
    setIsUploading(true);
    const uploadedMedia = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "Codennections");

      try {
        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dtnvngwew/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json();
        const type = file.type;

        uploadedMedia.push({
          url: data.secure_url,
          type: type.startsWith("image")
            ? "image"
            : type.startsWith("video")
            ? "video"
            : "file",
          fileName: file.name,
        });
      } catch (err) {
        console.error("Error uploading file 😭:", err);
        Swal.fire("Error", `Something happens... ${file.name}`, "error");
      }
    }

    setMedia((prev) => [...prev, ...uploadedMedia]);
    setIsUploading(false);
  };

  const handlePost = async () => {
    if (!text.trim() && media.length === 0) {
      Swal.fire("Oops", "Write something or upload a file!! 😉", "warning");
      return;
    }

    try {
      await addDoc(collection(db, "posts"), {
        userId: userData.uid,
        username: userData.nombre || userData.email,
        profilePic: userData.profilePic || null,
        text,
        media,
        quacks: 0,
        comments: [],
        createdAt: serverTimestamp(),
      });

      Swal.fire("Yeiii!", "Your post is now visible 👀✨", "success");
      setText("");
      setMedia([]);
      onPostCreated();
    } catch (err) {
      console.error("Error guardando el post:", err);
      Swal.fire("Error", "Something happens 🥺", "error");
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setMedia((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  return (
    <div className="create-post card p-3 shadow-sm">
      <div className="terminal-box mb-2">
        <div className="terminal-line">
        Codennections/CreatePost/{username} <span className="cursor">{`>`}</span>
        </div>
        <textarea
          className="terminal-textarea"
          placeholder=""
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <input
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.zip"
        onChange={(e) => handleMediaUpload(e.target.files)}
        className="form-control mb-3"
      />

      {media.length > 0 && (
        <div className="preview-grid mb-3">
          {media.map((file, i) => (
            <div key={i} className="preview-item">
              <button
                className="remove-button"
                onClick={() => handleRemoveFile(i)}
              >
                x
              </button>

              {file.type === "image" ? (
                <img src={file.url} alt={`media-${i}`} />
              ) : file.type === "video" ? (
                <video src={file.url} controls />
              ) : (
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  📎 {file.fileName}
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        className="btn btn-primary w-100"
        onClick={handlePost}
        disabled={isUploading}
      >
        {isUploading ? "Making some coding..." : "Ready to post!✨"}
      </button>
    </div>
  );
};

export default CreatePost;
