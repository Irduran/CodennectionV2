import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';

const SuggestedFriends = ({ currentUserId, refreshUser }) => {
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!currentUserId) return;

      const currentUserRef = doc(db, 'users', currentUserId);
      const currentUserSnap = await getDoc(currentUserRef);
      const currentUserData = currentUserSnap.data();
      const currentLanguages = currentUserData.programmingLanguages || [];
      const currentFollowing = currentUserData.following || [];

      const allUsersSnap = await getDocs(collection(db, 'users'));
      const suggestions = [];

      allUsersSnap.forEach((docSnap) => {
        const user = { id: docSnap.id, ...docSnap.data() };

        if (
          user.id !== currentUserId &&
          !currentFollowing.includes(user.id)
        ) {
          const sharedLanguages = user.programmingLanguages?.filter(lang =>
            currentLanguages.includes(lang)
          );

          if (sharedLanguages && sharedLanguages.length > 0) {
            suggestions.push(user);
          }
        }
      });

      setSuggestedUsers(suggestions);
    };

    fetchSuggestions();
  }, [currentUserId]);

  const handleFollow = async (targetUserId) => {
    if (!currentUserId || !targetUserId) return;

    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    await updateDoc(currentUserRef, {
      following: arrayUnion(targetUserId),
    });

    await updateDoc(targetUserRef, {
      followers: arrayUnion(currentUserId),
    });

    setSuggestedUsers(prev => prev.filter(user => user.id !== targetUserId));

    if (refreshUser) refreshUser();
  };

  return (
    <div className="suggested-friends-container">
      {suggestedUsers.length === 0 ? (
        <p>No hay sugerencias por ahora.</p>
      ) : (
        <ul>
          {suggestedUsers.map((user) => (
            <li key={user.id} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{user.nombre ?? user.email ?? 'Usuario sin nombre'}</span>
              <button
                onClick={() => handleFollow(user.id)}
                style={{
                  backgroundColor: '#b0619e',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  marginLeft: '1rem'
                }}
              >
                Seguir
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SuggestedFriends;
