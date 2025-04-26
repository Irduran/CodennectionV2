import React, { useEffect, useState } from 'react';
import edit from '../../assets/pencil-svgrepo-com.svg';
import './ProfileHeader.css';
import {
  doc, getDoc, updateDoc, arrayUnion, arrayRemove,
  addDoc, collection, serverTimestamp, query, where, getDocs
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import FollowersAndFollowing from '../Perfil/FollowersAndFollowing';
import SuggestedFriends from "../Perfil/SuggestedFriends";

export const ProfileHeader = ({ userData, currentUserId, refreshUser }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMyProfile, setIsMyProfile] = useState(false);
  const [buttonLabel, setButtonLabel] = useState('Follow');
  const [buttonClass, setButtonClass] = useState('default');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentData, setCurrentData] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (userData && currentUserId) {
      setIsMyProfile(userData.id === currentUserId);
    }
  }, [userData, currentUserId]);

  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (!userData?.id || !currentUserId || isMyProfile) return;

      const currentUserRef = doc(db, 'users', currentUserId);
      const currentUserSnap = await getDoc(currentUserRef);
      const currentUserData = currentUserSnap.data();

      setIsFollowing(currentUserData?.following?.includes(userData.id) || false);
    };

    checkFollowingStatus();
  }, [userData, currentUserId, isMyProfile]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!currentUserId) return;
      try {
        const docRef = doc(db, "users", currentUserId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCurrentData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching current user data:", error);
      }
    };

    fetchCurrentUser();
  }, [currentUserId]);

  useEffect(() => {
    if (isMyProfile || !currentUserId) return;

    if (isFollowing) {
      setButtonLabel('Codders');
      setButtonClass('codders');
    } else if (userData?.isPrivate) {
      setButtonLabel('? Codders');
    } else {
      setButtonLabel('Follow');
      setButtonClass('default');
    }
  }, [isFollowing, userData, isMyProfile, currentUserId]);

  const handleFollowToggle = async () => {
    if (!userData?.id || !currentUserId) return;

    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', userData.id);

    const currentUserSnap = await getDoc(currentUserRef);
    const targetUserSnap = await getDoc(targetUserRef);

    if (!currentUserSnap.exists() || !targetUserSnap.exists()) return;

    const currentUserData = currentUserSnap.data();
    const alreadyFollowing = currentUserData.following?.includes(userData.id);

    if (alreadyFollowing) {
      await updateDoc(currentUserRef, {
        following: arrayRemove(userData.id),
      });
      await updateDoc(targetUserRef, {
        followers: arrayRemove(currentUserId),
      });
      setIsFollowing(false);
    } else {
      await updateDoc(currentUserRef, {
        following: arrayUnion(userData.id),
      });
      await updateDoc(targetUserRef, {
        followers: arrayUnion(currentUserId),
      });
      setIsFollowing(true);
    }

    if (refreshUser) refreshUser();
  };

  const handleTogglePrivacy = async () => {
    if (!isMyProfile) return;
    try {
      const userRef = doc(db, 'users', currentUserId);
      await updateDoc(userRef, {
        isPrivate: !userData?.isPrivate
      });
      if (refreshUser) refreshUser();
    } catch (error) {
      console.error("Something happens: ", error);
    }
  };

  const sendNotification = async (recipientId) => {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('to', '==', recipientId),
        where('from', '==', currentUserId),
        where('type', '==', 'follow_request')
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return;
      }

      await addDoc(collection(db, 'notifications'), {
        to: recipientId,
        from: currentUserId,
        type: 'follow_request',
        message: `${currentData?.nombre} sent you a follow request.`,
        profilePic: currentData?.profilePic,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const handleButtonClick = async () => {
    if (userData?.isPrivate && !isFollowing) {
      await sendNotification(userData?.id);
      Swal.fire({
        title: 'Friend Request Sent',
        text: 'The request has been successfully sent!',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } else {
      await handleFollowToggle();
    }
  };

  const goToEdit = () => {
    navigate("/editprofile");
  };

  return (
    <>
      <div className="my-profile-container">
        <div className="my-banner"></div>
        <div className="my-profile-section">
          <img
            src={userData?.profilePic || 'path-to-default-image'}
            alt="Profile"
            className="my-profile-picture"
          />

          {isMyProfile && (
            <button className="my-edit-icon" onClick={goToEdit}>
              <img src={edit} alt="Edit Icon" />
            </button>
          )}

          <div className="my-text-info">
            <span className="my-info-name">
              {userData?.nombre || userData?.email || 'Mi Nombre'}
            </span>
            <span className="my-info-bio">
              {userData?.bio || 'My Bio!'}
            </span>

            <div className="my-followers-container">
              <span className="my-followers-count">
                <strong>{userData?.followers?.length || 0}</strong> Codders
              </span>
              <span className="my-following-count">
                <strong>{userData?.following?.length || 0}</strong> Codderwing
              </span>
            </div>

            <div className="my-button-container">
              <div
                className="my-button button-visibility"
                style={{ cursor: isMyProfile ? 'pointer' : 'default' }}
                onClick={handleTogglePrivacy}
              >
                {userData?.isPrivate ? 'Private 🔒' : 'Public 🌍'}
              </div>

              <div
                className="my-button button-followers"
                onClick={() => {
                  setShowFollowers(true);
                  setShowFollowing(false);
                  setShowSuggestions(false);
                }}
              >
                <span>👥 Codders</span>
              </div>

              <div
                className="my-button button-following"
                onClick={() => {
                  setShowFollowers(false);
                  setShowFollowing(true);
                  setShowSuggestions(false);
                }}
              >
                <span>📌 Codderwing</span>
              </div>

              {isMyProfile && (
                <div
                  className="my-button button-suggestions"
                  onClick={() => {
                    setShowFollowers(false);
                    setShowFollowing(false);
                    setShowSuggestions(true);
                  }}
                >
                  <span>🤝 Suggested Codders</span>
                </div>
              )}
            </div>

            {!isMyProfile && currentUserId && (
              <>
                <button
                  className={`follow-btn ${buttonClass}`}
                  onClick={handleButtonClick}
                  onMouseEnter={() => isFollowing && setButtonLabel('!Codders')}
                  onMouseLeave={() => isFollowing && setButtonLabel('Codders')}
                >
                  {buttonLabel}
                </button>

                <button
                  className="report-btn"
                  style={{ marginTop: '0.5rem', backgroundColor: '#ff4d4d', color: 'white', borderRadius: '8px', padding: '5px 10px' }}
                >
                  🚨 Report Codder
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {(showFollowers || showFollowing) && (
        <>
          <div className="modal-overlay" onClick={() => {
            setShowFollowers(false);
            setShowFollowing(false);
          }} />

          <div className="modal-content">
            <h3>{showFollowers ? '👥 Codders' : '📌 Codderwing'}</h3>
            <FollowersAndFollowing
              type={showFollowers ? 'followers' : 'following'}
              userId={userData?.id}
              currentUserId={currentUserId}
              refreshUser={refreshUser}
            />
            <button className="close-modal-btn" onClick={() => {
              setShowFollowers(false);
              setShowFollowing(false);
            }}>
              ❌ Close
            </button>
          </div>
        </>
      )}

      {showSuggestions && (
        <>
          <div className="modal-overlay" onClick={() => setShowSuggestions(false)} />
          <div className="modal-content">
            <h3>🤝 Suggested Codders</h3>
            <SuggestedFriends currentUserId={currentUserId} refreshUser={refreshUser} />
            <button className="close-modal-btn" onClick={() => setShowSuggestions(false)}>
              ❌ Close
            </button>
          </div>
        </>
      )}
    </>
  );
};
