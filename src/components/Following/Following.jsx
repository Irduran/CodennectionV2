import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const Following = () => {
  const [following, setFollowing] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchFollowing = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setFollowing(userSnap.data().following || []);
      }
    };

    if (user) fetchFollowing();
  }, [user?.uid]);

  const unfollowUser = async (followedId) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const updatedFollowing = userSnap.data().following.filter(id => id !== followedId);
      await updateDoc(userRef, { following: updatedFollowing });
      setFollowing(updatedFollowing);
    }
  };

  return (
    <div>
      <h3>Siguiendo</h3>
      <ul>
        {following.map(followedId => (
          <li key={followedId}>
            {followedId}
            <button onClick={() => unfollowUser(followedId)}>Dejar de seguir</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Following;
