import React from "react";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <h1>Welcome to Bake.LK Admin Panel</h1>
        <p className="dashboard-subtitle">
          Manage your cakes and orders efficiently
        </p>

        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h3>Add New Cakes</h3>
            <p>Add new delicious cakes to your menu</p>
          </div>
          <div className="dashboard-card">
            <h3>Manage Inventory</h3>
            <p>View and manage your cake inventory</p>
          </div>
        </div>

        <div className="welcome-message">
          <h2>🎂 Ready to Create Sweet Memories?</h2>
          <p>
            Use the sidebar to navigate between adding new cakes and managing
            your inventory.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
