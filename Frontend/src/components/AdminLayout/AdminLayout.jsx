import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import "./AdminLayout.css";
import Slidebar from "../Slidebar/Slidebar";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import LoginPopup from "../LoginPopup/LoginPopup";

const AdminLayout = () => {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="admin-layout">
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : <></>}
      <Navbar setShowLogin={setShowLogin} />
      <div className="main-content">
        <Slidebar />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminLayout;
