import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import Swal from "sweetalert2";
import "./EditProfile.css";

function EditProfile() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [bio, setBio] = useState("");
  const [programmingLanguages, setProgrammingLanguages] = useState([]);
  const [newLanguage, setNewLanguage] = useState("");
  const [user, setUser] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    const userData = sessionStorage.getItem("userData");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setUsername(parsedUser.nombre || "");
      setBio(parsedUser.bio || "");
      setProfilePicUrl(parsedUser.profilePic || "");
      setProgrammingLanguages(parsedUser.programmingLanguages || []);
      setIsPrivate(parsedUser.isPrivate || false);
      setFollowers(parsedUser.followers || [])
      setFollowing(parsedUser.following || [])
    } else {
      navigate("/");
    }
  }, [navigate]);

  const uploadImageToCloudinary = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "Codennections");
      formData.append("api_key", "dtnvngwew");
      formData.append("cloud_name", "dtnvngwew");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dtnvngwew/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Error al subir la imagen");
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      Swal.fire({
        icon: "error",
        title: "Upload Error",
        text: "No se pudo subir la imagen. Inténtalo de nuevo.",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditProfile = async () => {
    if (!username.trim() || !bio.trim() || programmingLanguages.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Oopsi...",
        text: "Fill all the fields, pleeeease 🥺",
      });
      return;
    }

    try {
      const userAuth = auth.currentUser;
      let imageUrl = user?.profilePic || "";

      // Subir nueva imagen solo si se seleccionó una
      if (profilePic) {
        imageUrl = await uploadImageToCloudinary(profilePic);
        if (!imageUrl && profilePic) return; // Si falla la subida y hay imagen nueva, no continuar
      }

      const userData = {
        uid: userAuth.uid,
        email: userAuth.email,
        nombre: username,
        profilePic: imageUrl,
        bio: bio,
        programmingLanguages: programmingLanguages,
        isPrivate: isPrivate,
        followers: followers,
        following: following
      };

      // Guardar datos en Firebase
      await setDoc(doc(db, "users", userAuth.uid), userData);

      // Guardar datos en sessionStorage
      sessionStorage.setItem("userData", JSON.stringify(userData));

      // Redirigir al perfil
      navigate("/profile");
    } catch (error) {
      console.error("Error al guardar el usuario:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al guardar los datos. Inténtalo de nuevo.",
      });
    }
  };

  const handleAddLanguage = () => {
    if (newLanguage.trim() !== "") {
      setProgrammingLanguages([...programmingLanguages, newLanguage.trim()]);
      setNewLanguage("");
    }
  };

  const handleRemoveLanguage = (indexToRemove) => {
    setProgrammingLanguages(programmingLanguages.filter((_, index) => index !== indexToRemove));
  };

  const handleFileChange = (file) => {
    if (file && file.type.startsWith("image/")) {
      setProfilePic(file);
      // Mostrar preview local mientras se sube
      setProfilePicUrl(URL.createObjectURL(file));
    }
  };

  return (
    <>
      <div className="registro-page">
        <div className="registro-container">
          <h1>Some Changes...🪄</h1>
          <p>Email: {user?.email}</p>
          <div className="form-columns">
            <div className="form-column">
              <input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <div className="checkbox-container">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  Make my account private 🔒
                </label>
              </div>

              <div className="bio-container">
                <textarea
                  id="bio"
                  placeholder="Bio (max 100 characters)"
                  value={bio}
                  onChange={(e) => {
                    if (e.target.value.length <= 100) {
                      setBio(e.target.value);
                    }
                  }}
                  maxLength={100}
                />
                <p className="char-counter">{bio.length}/100</p>
              </div>
              <div className="add-language-container">
                <input
                  id="programming"
                  type="text"
                  placeholder="Add a programming language"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddLanguage()}
                />
                <button className="add" onClick={handleAddLanguage}>
                  +
                </button>
              </div>
              <ul className="languages-list">
                {programmingLanguages.map((lang, index) => (
                  <li key={index}>
                    {lang}
                    <span 
                      className="remove-language" 
                      onClick={() => handleRemoveLanguage(index)}
                    >
                      ✖
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="form-column">
              <div
                className="file-drop-area"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("dragover");
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove("dragover");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("dragover");
                  const file = e.dataTransfer.files[0];
                  handleFileChange(file);
                }}
              >
                {profilePicUrl ? (
                  <>
                    <img
                      src={profilePicUrl}
                      alt="Preview"
                      className="image-preview"
                    />
                    {isUploading && (
                      <div className="upload-progress">
                        <p>Uploading... {uploadProgress}%</p>
                        <progress value={uploadProgress} max="100" />
                      </div>
                    )}
                  </>
                ) : user?.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt="Current Profile"
                    className="image-preview"
                  />
                ) : (
                  <>
                    <p>🖼️ Drag and Drop your new profile picture 🖼️</p>
                    <p>or</p>
                    <input
                      type="file"
                      id="file-input"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        handleFileChange(file);
                      }}
                      style={{ display: "none" }}
                    />
                    <label htmlFor="file-input" className="file-input-label">
                      Select a file...
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>
          <button onClick={handleEditProfile} disabled={isUploading}>
            {isUploading ? "Saving..." : "⭐Save⭐"}
          </button>
        </div>
      </div>
    </>
  );
}

export default EditProfile;