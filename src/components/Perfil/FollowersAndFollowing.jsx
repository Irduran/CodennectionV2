import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase';

const FollowersAndFollowing = ({ type, userId, currentUserId, refreshUser }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!userId) return;

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const userIds = type === 'followers' ? data.followers : data.following;

        if (userIds?.length > 0) {
          const promises = userIds.map(async (id) => {
            const uRef = doc(db, 'users', id);
            const uSnap = await getDoc(uRef);
            return uSnap.exists() ? { id: uSnap.id, ...uSnap.data() } : null;
          });

          const results = await Promise.all(promises);
          setUsers(results.filter(Boolean));
        } else {
          setUsers([]);
        }
      }
    };

    fetchUsers();
  }, [type, userId]);

  const handleRemove = async (targetId) => {
    const currentRef = doc(db, 'users', userId);
    const targetRef = doc(db, 'users', targetId);

    if (type === 'followers') {
      await updateDoc(currentRef, { followers: arrayRemove(targetId) });
      await updateDoc(targetRef, { following: arrayRemove(userId) });
    } else {
      await updateDoc(currentRef, { following: arrayRemove(targetId) });
      await updateDoc(targetRef, { followers: arrayRemove(userId) });
    }

    setUsers((prev) => prev.filter((u) => u.id !== targetId));
    if (refreshUser) refreshUser();
  };

  return (
    <div>
      {users.length === 0 ? (
        <p>No {type === 'followers' ? 'tenés seguidores' : 'estás siguiendo a nadie'} aún.</p>
      ) : (
        <ul>
          {users.map((u) => (
            <li key={u.id}>
              {u.nombre ?? u.email ?? u.id}
              {currentUserId === userId && (
                <button
                  onClick={() => handleRemove(u.id)}
                  style={{
                    marginLeft: '10px',
                    backgroundColor: '#e74c3c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '3px 10px',
                    cursor: 'pointer'
                  }}
                >
                  Eliminar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FollowersAndFollowing;
