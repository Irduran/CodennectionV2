import React, { useEffect, useState } from 'react';
import './OtherUser.css';
import TopBar from '../Navigation/TopBar';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import PostUser from '../PostUser/PostUser';
import { ProfileHeader } from '../ProfileHeader/ProfileHeader';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Swal from 'sweetalert2';

const OtherUser = () => {
  const [userData, setUserData] = useState(null);
  const [userPosts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const { userId } = useParams();
  const [hasBlocked, setHasBlocked] = useState(false);

useEffect(() => {
  const checkIfBlocked = async () => {
    if (!currentUserId || !userId) return;

    const currentUserRef = doc(db, 'users', currentUserId);
    const currentUserSnap = await getDoc(currentUserRef);
    const currentUserData = currentUserSnap.data();

    if (currentUserData?.blockedUsers?.includes(userId)) {
      setHasBlocked(true);
    } else {
      setHasBlocked(false);
    }
  };

  checkIfBlocked();
}, [currentUserId, userId]);


  // Listen for Auth changes
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch user data
  const fetchUserData = async () => {
    if (!userId) return;
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() };
      setUserData(data);
      getUserPosts(docSnap.id);
    }
  };

  // Refresh method to pass down
  const refreshUser = () => {
    fetchUserData();
  };

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  // Fetch posts
  const getUserPosts = async (uid) => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const userPosts = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((post) => post.userId === uid);
    setPosts(userPosts);
  };

  // Edit, Save, Delete posts
  const handleEdit = (postId, currentText) => {
    setEditingPostId(postId);
    setEditedText(currentText);
  };

  const handleSave = async (postId) => {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { text: editedText });
    setEditingPostId(null);
    setEditedText('');
    getUserPosts(userData.id);
  };

  const handleDelete = async (postId) => {
    const confirmDelete = window.confirm('¿Seguro que quieres borrar este post?');
    if (!confirmDelete) return;
    await deleteDoc(doc(db, 'posts', postId));
    getUserPosts(userData.id);
  };

  const handleChangeEdit = (e) => {
    setEditedText(e.target.value);
  };

  return (
    <>
      <TopBar />
      <div className="mypost-container">
        {userData?.isDeactivated ? (
          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'white' }}>
            🚫 Deactivated Account
          </p>
        ) : (
          <>
            {userData && currentUserId && (
              <ProfileHeader
                userData={userData}
                currentUserId={currentUserId}
                refreshUser={refreshUser}
              />
            )}
  
            {/* Blocked check */}
            {userData?.blockedUsers?.includes(currentUserId) || hasBlocked ? (
              <p style={{ textAlign: 'center', marginTop: '2rem', color: 'white' }}>
                ❌ User Blocked.
              </p>
            ) : (
              <>
                {/* Posts or Private notice */}
                {(!userData?.isPrivate || userData?.followers?.includes(currentUserId)) ? (
                  <div className="user-posts-section">
                    {userPosts.length === 0 ? (
                      <p style={{ textAlign: 'center', marginTop: '2rem', color: 'white' }}>
                        This user hasn't posted anything yet.
                      </p>
                    ) : (
                      userPosts.map((post) => (
                        <PostUser
                          key={post.id}
                          id={post.id}
                          username={post.username}
                          profilePic={post.profilePic}
                          time={new Date(post.createdAt?.seconds * 1000).toLocaleString()}
                          text={editingPostId === post.id ? editedText : post.text}
                          media={post.media}
                          quacks={post.quacks}
                          sharedBy={post.sharedBy}
                          comments={post.comments}
                          isEditing={editingPostId === post.id}
                          onEdit={() => handleEdit(post.id, post.text)}
                          onSave={() => handleSave(post.id)}
                          onDelete={() => handleDelete(post.id)}
                          onChangeEdit={handleChangeEdit}
                        />
                      ))
                    )}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', marginTop: '2rem', color: 'white' }}>
                    📛 This profile is private.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );   
};  

export default OtherUser;