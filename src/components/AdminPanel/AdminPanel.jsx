import { useEffect, useState } from "react";
import {
  db,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "../../firebase";
import "./AdminPanel.css";
import { Logout } from "../Logout/Logout";
import Swal from "sweetalert2";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [postReports, setPostReports] = useState([]);
  const [userSubReports, setUserSubReports] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [showOnlyReportedPosts, setShowOnlyReportedPosts] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  // ─────────────────────────────────────────────────────────────
  // 🔁 Cargar datos iniciales
  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("userData"));
    if (userData?.email?.endsWith("@codennection.com")) {
      setCurrentUser(userData);
      fetchUsers();
      fetchPosts();
      fetchUserReports();
      fetchPostReports();
      fetchReportedUsersSubcollection();
    } else {
      alert("No tienes permisos para acceder aquí.");
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 📦 FETCHS

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const fetchPosts = async () => {
    const snapshot = await getDocs(collection(db, "posts"));
    setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const fetchUserReports = async () => {
    const snapshot = await getDocs(collection(db, "userReports"));
    const filtered = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((report) => report.reportedUserId);
    setUserReports(filtered);
  };

  const fetchPostReports = async () => {
    const postsSnapshot = await getDocs(collection(db, "posts"));
    const allReports = [];

    for (const postDoc of postsSnapshot.docs) {
      const postId = postDoc.id;
      const postData = postDoc.data();
      const reportsRef = collection(db, "posts", postId, "reports");
      const reportsSnapshot = await getDocs(reportsRef);

      reportsSnapshot.forEach((reportDoc) => {
        allReports.push({
          id: reportDoc.id,
          postId,
          ...reportDoc.data(),
          postData,
        });
      });
    }

    setPostReports(allReports);
  };

  const fetchReportedUsersSubcollection = async () => {
    const snapshot = await getDocs(collection(db, "usersReported"));
    const allReports = [];

    for (const userDoc of snapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const reportsRef = collection(db, "usersReported", userId, "reports");
      const reportsSnapshot = await getDocs(reportsRef);

      reportsSnapshot.forEach((reportDoc) => {
        allReports.push({
          id: reportDoc.id,
          userId,
          ...reportDoc.data(),
          userData,
        });
      });
    }

    setUserSubReports(allReports);
  };

  // ─────────────────────────────────────────────────────────────
  // ⚙️ HANDLERS

  const handleSuspendUser = async (userId) => {
    const confirm = await Swal.fire({
      title: "¿Suspender cuenta?",
      text: "El usuario no podrá volver a iniciar sesión.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, suspender",
    });

    if (confirm.isConfirmed) {
      await updateDoc(doc(db, "users", userId), { isSuspended: true });
      Swal.fire("Usuario suspendido", "", "success");
      fetchUsers();
    }
  };

  const handleReactivateUser = async (userId) => {
    await updateDoc(doc(db, "users", userId), { isSuspended: false });
    Swal.fire("Usuario reactivado", "", "success");
    fetchUsers();
  };

  const handleDeletePost = async (postId) => {
    await deleteDoc(doc(db, "posts", postId));
    fetchPosts();
  };

  // ─────────────────────────────────────────────────────────────
  // 🔎 HELPERS

  const getUserReportCount = (uid) =>
    userReports.filter((r) => r.reportedUserId === uid).length;

  const getPostReportCount = (postId) =>
    postReports.filter((r) => r.postId === postId).length;

  if (!currentUser) return <p>Loading...</p>;

  // ─────────────────────────────────────────────────────────────
  // 🖥️ UI

  return (
    <div className="admin-panel">
      <aside className="sidebar">
        <div className="logo">{`{<>}`} </div>
        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          👤 User Report
        </button>
        <button
          className={activeTab === "posts" ? "active" : ""}
          onClick={() => setActiveTab("posts")}
        >
          📄 Posts
        </button>
        <button
          className={activeTab === "reports" ? "active" : ""}
          onClick={() => setActiveTab("reports")}
        >
          🚨 Reports
        </button>
        <Logout />
      </aside>

      <main className="content">
        {activeTab === "users" && (
          <>
            <h3 className="section-title">Users</h3>
            <input
              type="text"
              className="search-input"
              placeholder="Search by email"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value.toLowerCase())}
            />
            <div className="card-grid">
              {users
                .filter(
                  (user) =>
                    user.email?.toLowerCase().includes(userSearch) ||
                    user.nombre?.toLowerCase().includes(userSearch)
                )
                .map((user) => (
                  <div key={user.id} className="user-card">
                    {getUserReportCount(user.id) > 0 && (
                      <div className="warning-icon">
                        ⚠️ {getUserReportCount(user.id)}
                      </div>
                    )}
                    <div className="user-avatar">
                      {user.profilePic ? (
                        <img src={user.profilePic} alt="Avatar" />
                      ) : (
                        <div className="default-avatar">👤</div>
                      )}
                    </div>
                    <div className="user-info">
                      <p className="user-email">{user.email}</p>
                    </div>
                    {user.isSuspended ? (
                      <button
                        className="reactivate-btn"
                        onClick={() => handleReactivateUser(user.id)}
                      >
                        ✅ Reactivate
                      </button>
                    ) : (
                      <button
                        className="suspend-btn"
                        onClick={() => handleSuspendUser(user.id)}
                      >
                        🚫 Suspend
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </>
        )}

        {activeTab === "posts" && (
          <>
            <button
              className="filter-btn"
              onClick={() => setShowOnlyReportedPosts(!showOnlyReportedPosts)}
            >
              {showOnlyReportedPosts ? "Show all" : "Reports only"}
            </button>
            <h3 className="section-title">Post</h3>
            <div className="card-grid">
              {posts
                .filter(
                  (post) =>
                    !showOnlyReportedPosts || getPostReportCount(post.id) > 0
                )
                .map((post) => (
                  <div key={post.id} className="user-card">
                    {getPostReportCount(post.id) > 0 && (
                      <div className="warning-icon">
                        ⚠️ {getPostReportCount(post.id)}
                      </div>
                    )}
                    {post.media?.[0]?.type === "image" && (
                      <div className="post-image">
                        <img src={post.media[0].url} alt="Post" />
                      </div>
                    )}
                    <div className="user-avatar">
                      <div className="default-avatar">👤</div>
                    </div>
                    <div className="user-info">
                      <p className="user-email">
                        {post.username || "Unknown User"}
                      </p>
                    </div>
                    <p className="post-text">{post.text || "(No content)"}</p>
                    <button
                      className="suspend-btn"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      🗑 Delete
                    </button>
                  </div>
                ))}
            </div>
          </>
        )}

        {activeTab === "reports" && (
          <>
            <h3 className="section-title">Reports</h3>
            <div className="card-grid">
              {postReports.map((report) => (
                <div key={report.id} className="user-card">
                  {getPostReportCount?.(report.postId) > 0 && (
                    <div className="warning-icon">
                      ⚠️ {getPostReportCount(report.postId)}
                    </div>
                  )}
                  {report.postData?.media?.[0]?.type === "image" && (
                    <div className="post-image">
                      <img
                        src={report.postData.media[0].url}
                        alt="Reported Post"
                      />
                    </div>
                  )}
                  <div className="user-avatar">
                    <div className="default-avatar">👤</div>
                  </div>
                  <div className="user-info">
                    <p className="user-email">
                      {report.postData.username || "Unknown User"}
                    </p>
                  </div>
                  <p className="post-text">
                    {report.postData.text || "(No content)"}
                  </p>
                  <p className="post-text">
                    <strong>Reason:</strong> {report.reason}
                  </p>
                  <p className="post-text">
                    <strong>Reported by:</strong> {report.reportedBy}
                  </p>
                  <p className="post-text">
                    <strong>Date:</strong>{" "}
                    {report.reportedAt?.toDate?.().toLocaleString() || "Unknown"}
                  </p>
                  <button
                    className="suspend-btn"
                    onClick={() => handleDeletePost(report.postId)}
                  >
                    🗑 Delete Report
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminPanel;
