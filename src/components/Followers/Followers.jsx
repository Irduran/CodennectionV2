import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const Followers = () => {
  const [followers, setFollowers] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchFollowers = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setFollowers(userSnap.data().followers || []);
      }
    };

    fetchFollowers();
  }, [user.uid]);

  const removeFollower = async (followerId) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const updatedFollowers = userSnap.data().followers.filter(id => id !== followerId);
      await updateDoc(userRef, { followers: updatedFollowers });
      setFollowers(updatedFollowers);
    }
  };

  return (
    <div>
      <h3>Seguidores</h3>
      <ul>
        {followers.map(followerId => (
          <li key={followerId}>
            {followerId}
            <button onClick={() => removeFollower(followerId)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Followers;
