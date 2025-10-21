/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import "./Slidebar.css";
import { assets } from "../../assets/frontend_assets/assets";
import { NavLink } from "react-router-dom";

const Slidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={toggleSidebar}>
          {isCollapsed ? (
            // Double arrow pointing right when collapsed (to expand)
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="collapse-icon"
            >
              <path d="M6 17l5-5-5-5" />
              <path d="M13 17l5-5-5-5" />
            </svg>
          ) : (
            // Double arrow pointing left when expanded (to collapse)
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="collapse-icon"
            >
              <path d="M18 17l-5-5 5-5" />
              <path d="M11 17l-5-5 5-5" />
            </svg>
          )}
        </button>
      </div>

      <div className="sildebar-options">
        <NavLink
          to="/admin"
          className="sidebar-option"
          end
          data-tooltip="Dashboard"
        >
          <img src={assets.profile_icon} alt="" />
          <p className={isCollapsed ? "hidden" : ""}>Dashboard</p>
        </NavLink>
        <NavLink
          to="/admin/addcake"
          className="sidebar-option"
          data-tooltip="Add Items"
        >
          <img src={assets.add_icon_green} alt="" />
          <p className={isCollapsed ? "hidden" : ""}>Add Items</p>
        </NavLink>
        <NavLink
          to="/admin/cakelist"
          className="sidebar-option"
          data-tooltip="List Items"
        >
          <img src={assets.bag_icon} alt="" />
          <p className={isCollapsed ? "hidden" : ""}>List Items</p>
        </NavLink>
      </div>
    </div>
  );
};

export default Slidebar;
