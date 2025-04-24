import React, { useState, useEffect } from "react";
import Navbar from "react-bootstrap/Navbar";
import logo from "./../../assets/codennectionlogo_white.png";
import "./TopBar.css";
import { Notification } from "../Notification/Notification";
import { Logout } from "../Logout/Logout";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

const TopBar = ({ onSearchChange }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [userData, setUserData] = useState(); 

  const handleLogoClick = () => {
    navigate("/dashboard");
  };

  useEffect(() => {
    const storedUserData = JSON.parse(sessionStorage.getItem("userData"));
    if (!storedUserData) {
      navigate("/"); 
    } else {
      setUserData(storedUserData);
    }
  }, [navigate]);

  const handleSearch = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(usersRef);
      const lowerTerm = term.toLowerCase();

      const results = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((user) => user.nombre && user.nombre.toLowerCase().includes(lowerTerm));

      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchTerm);
      if (onSearchChange) {
        onSearchChange(searchTerm);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, onSearchChange]);

  const handleResultClick = (userId) => {
    navigate(`/user/${userId}`);
    setSearchTerm("");
    setShowResults(false);
  };

  return (
    <div className="position-absolute w-100">
      <Navbar className="topbar-container justify-content-evenly">
        <div className="d-flex flex-row position-relative">
          <img
            src={logo}
            className="topbar-logo"
            alt="logo"
            onClick={handleLogoClick}
            style={{ cursor: "pointer" }}
          />
          <span className="topbar-name">codennections</span>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search"
              className="topbar-search"
              value={searchTerm}
              onChange={(e) => {
                const term = e.target.value;
                setSearchTerm(term);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
            />
            {showResults && searchResults.length > 0 && (
              <div className="search-results-dropdown">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="search-result-item d-flex align-items-center"
                    onClick={() => handleResultClick(user.id)}
                  >
                    <img
                      src={user.profilePic}
                      alt="Profile"
                      className="search-result-img me-2"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/40";
                      }}
                    />
                    <span>{user.nombre}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {userData && <Notification currentUserId={userData.uid} />}

        <Logout />
      </Navbar>
    </div>
  );
};

export default TopBar;
