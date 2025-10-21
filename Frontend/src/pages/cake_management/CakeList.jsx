// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from "react";
import "./CakeList.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import { useStore } from "../../context/StoreContext";

const CakeList = () => {
  const url = "http://localhost:5000/api/cakes";
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    cakeId: null,
    cakeName: "",
  });
  const navigate = useNavigate();
  const { token } = useStore();

  // Fetch list of cakes
  const fetchList = async () => {
    try {
      setLoading(true);
      const response = await axios.get(url);
      if (response.data.success) {
        setList(response.data.data);
      } else {
        toast.error("Error fetching cake list");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const removeCake = async (cakeId) => {
    try {
      const response = await axios.delete(`${url}/${cakeId}` , {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data.success) {
        toast.success("Cake deleted successfully");
        await fetchList();
        setDeleteModal({ show: false, cakeId: null, cakeName: "" });
      } else {
        toast.error("Error deleting cake");
      }
    } catch (error) {
      console.error("Error:", error);
      if (error?.response?.status === 401) {
        toast.error("Unauthorized. Please log in as admin to delete.");
      } else if (error?.response?.status === 403) {
        toast.error("Forbidden. Admin role required to delete.");
      } else {
        toast.error("Error deleting cake");
      }
    }
  };

  const handleDeleteClick = (cakeId, cakeName) => {
    setDeleteModal({ show: true, cakeId, cakeName });
  };

  const handleEditClick = (cakeId) => {
    navigate(`/admin/editcake/${cakeId}`);
  };

  const confirmDelete = () => {
    if (deleteModal.cakeId) {
      removeCake(deleteModal.cakeId);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, cakeId: null, cakeName: "" });
  };

  // Generate and download PDF
  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header with company branding
      doc.setFillColor(36, 150, 181); // Blue background
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // Main title - very clear and prominent
      doc.setTextColor(255, 255, 255); // White text
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text("CAKE INVENTORY REPORT", pageWidth / 2, 18, { align: "center" });
      
      // Company subtitle
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text("Cake Management System", pageWidth / 2, 28, { align: "center" });
      
      // Report type subtitle
      doc.setFontSize(12);
      doc.setFont("helvetica", "italic");
      doc.text("Complete Inventory Analysis & Stock Status", pageWidth / 2, 36, { align: "center" });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      yPosition = 60;

      // Report info section
      doc.setFillColor(248, 250, 252); // Light gray background
      doc.rect(15, yPosition - 5, pageWidth - 30, 25, 'F');
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("REPORT DETAILS", 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const currentDate = new Date();
      const dateStr = currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const timeStr = currentDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      doc.text(`Generated on: ${dateStr} at ${timeStr}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Report Type: ${filteredCakes.length > 0 ? 'Filtered View' : 'Complete Inventory'}`, 20, yPosition);
      yPosition += 20;

      // Summary statistics with boxes
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("INVENTORY SUMMARY", 20, yPosition);
      yPosition += 15;

      const totalCakes = list.length;
      const inStock = list.filter((cake) => cake.qty > 0).length;
      const outOfStock = list.filter((cake) => cake.qty === 0).length;
      const lowStock = list.filter((cake) => cake.qty > 0 && cake.qty < 5).length;

      // Create summary boxes
      const boxWidth = (pageWidth - 50) / 4;
      const boxHeight = 25;
      const boxY = yPosition - 5;

      // Total Cakes Box
      doc.setFillColor(59, 130, 246); // Blue
      doc.rect(15, boxY, boxWidth, boxHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(String(totalCakes), 15 + boxWidth/2, boxY + 10, { align: "center" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Total Cakes", 15 + boxWidth/2, boxY + 18, { align: "center" });

      // In Stock Box
      doc.setFillColor(34, 197, 94); // Green
      doc.rect(15 + boxWidth + 5, boxY, boxWidth, boxHeight, 'F');
      doc.text(String(inStock), 15 + boxWidth + 5 + boxWidth/2, boxY + 10, { align: "center" });
      doc.setFontSize(8);
      doc.text("In Stock", 15 + boxWidth + 5 + boxWidth/2, boxY + 18, { align: "center" });

      // Out of Stock Box
      doc.setFillColor(239, 68, 68); // Red
      doc.rect(15 + (boxWidth + 5) * 2, boxY, boxWidth, boxHeight, 'F');
      doc.text(String(outOfStock), 15 + (boxWidth + 5) * 2 + boxWidth/2, boxY + 10, { align: "center" });
      doc.setFontSize(8);
      doc.text("Out of Stock", 15 + (boxWidth + 5) * 2 + boxWidth/2, boxY + 18, { align: "center" });

      // Low Stock Box
      doc.setFillColor(245, 158, 11); // Orange
      doc.rect(15 + (boxWidth + 5) * 3, boxY, boxWidth, boxHeight, 'F');
      doc.text(String(lowStock), 15 + (boxWidth + 5) * 3 + boxWidth/2, boxY + 10, { align: "center" });
      doc.setFontSize(8);
      doc.text("Low Stock", 15 + (boxWidth + 5) * 3 + boxWidth/2, boxY + 18, { align: "center" });

      // Reset text color
      doc.setTextColor(0, 0, 0);
      yPosition += 35;

      // Table section
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CAKE INVENTORY DETAILS", 20, yPosition);
      yPosition += 15;

      // Table headers with background
      doc.setFillColor(71, 85, 105); // Dark gray
      doc.rect(15, yPosition - 8, pageWidth - 30, 12, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      
      const headers = ["CAKE NAME", "CATEGORY", "PRICE", "STOCK", "DESCRIPTION"];
      const colWidths = [35, 20, 18, 12, 75];
      let xPosition = 20;

      headers.forEach((header, index) => {
        doc.text(header, xPosition, yPosition - 2);
        xPosition += colWidths[index];
      });

      // Reset text color
      doc.setTextColor(0, 0, 0);
      yPosition += 8;

      // Table data with alternating row colors
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const dataToExport = filteredCakes.length > 0 ? filteredCakes : list;

      dataToExport.forEach((cake, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
          
          // Redraw table header on new page
          doc.setFillColor(71, 85, 105);
          doc.rect(15, yPosition - 8, pageWidth - 30, 12, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          xPosition = 20;
          headers.forEach((header, headerIndex) => {
            doc.text(header, xPosition, yPosition - 2);
            xPosition += colWidths[headerIndex];
          });
          doc.setTextColor(0, 0, 0);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          yPosition += 8;
        }

        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, yPosition - 6, pageWidth - 30, 8, 'F');
        }

        xPosition = 20;
        const rowData = [
          String(cake.productName || "N/A").replace(/[^\x00-\x7F]/g, ""), // Remove non-ASCII characters
          String(cake.category || "N/A").replace(/[^\x00-\x7F]/g, ""),
          `Rs.${cake.price || 0}`,
          String(cake.qty || 0),
          String((cake.description || "N/A").substring(0, 80) + (cake.description && cake.description.length > 80 ? "..." : "")).replace(/[^\x00-\x7F]/g, "")
        ];

        rowData.forEach((data, colIndex) => {
          // Color code stock levels
          if (colIndex === 3) { // Stock column
            const stock = parseInt(cake.qty || 0);
            if (stock === 0) {
              doc.setTextColor(239, 68, 68); // Red for out of stock
            } else if (stock < 5) {
              doc.setTextColor(245, 158, 11); // Orange for low stock
            } else {
              doc.setTextColor(34, 197, 94); // Green for good stock
            }
          } else {
            doc.setTextColor(0, 0, 0); // Black for other columns
          }
          
          doc.text(String(data), xPosition, yPosition);
          xPosition += colWidths[colIndex];
        });
        
        yPosition += 8;
      });

      // Footer with company info
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Footer background
        doc.setFillColor(36, 150, 181);
        doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
        
        // Footer text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
        doc.text("Generated by Cake Management System", pageWidth / 2, pageHeight - 14, { align: "center" });
      }

      // Download the PDF
      const fileName = `cake-inventory-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success("PDF report downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error generating PDF");
    }
  };

  // Get unique categories
  const categories = ['All', ...new Set((Array.isArray(list) ? list : []).map(cake => cake.category))];

  // Filter and sort cakes
  const filteredCakes = (Array.isArray(list) ? list : [])
    .filter(cake => {
      const matchesSearch = cake.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cake.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || cake.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.productName.localeCompare(b.productName);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

  // useEffect to call fetchList on component mount
  useEffect(() => {
    fetchList();
  }, []); // Empty dependency array means it will run once after initial render

  return (
    <>
      <div className="cake-list-container">
        {/* Header Section */}
        <div className="cake-list-header">
          <div className="header-top">
            <div className="header-text">
              <h1 className="cake-list-title">Cake Inventory</h1>
              <p className="cake-list-subtitle">
                Manage your cake collection with ease
              </p>
            </div>
            <button
              className="pdf-download-btn"
              onClick={downloadPDF}
              title="Download PDF Report"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              Download PDF
            </button>
          </div>
          <div className="cake-list-stats">
            <div className="stat-item">
              <span className="stat-number">{list.length}</span>
              <span className="stat-label">Total Cakes</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {list.filter((cake) => cake.qty > 0).length}
              </span>
              <span className="stat-label">In Stock</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {list.filter((cake) => cake.qty === 0).length}
              </span>
              <span className="stat-label">Out of Stock</span>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="cake-filters">
          <div className="search-container">
            <svg
              className="search-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search cakes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-container">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-filter"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-filter"
            >
              <option value="name">Sort by Name</option>
              <option value="category">Sort by Category</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Content Section */}
        <div className="cake-list-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading cakes...</p>
            </div>
          ) : filteredCakes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎂</div>
              <h3>
                {list.length === 0 
                  ? "No Cakes Found" 
                  : "No Cakes Match Your Filters"}
              </h3>
              <p>
                {list.length === 0 
                  ? "Start by adding your first cake to the inventory"
                  : "Try adjusting your search or filter criteria"}
              </p>
              {list.length === 0 && (
                <button
                  className="add-first-cake-btn"
                  onClick={() => navigate("/admin/addcake")}
                >
                  Add Your First Cake
                </button>
              )}
            </div>
          ) : (
            <div className="cake-grid">
              {filteredCakes.map((item) => (
                <div
                  key={item._id}
                  className={`cake-card ${
                    item.qty === 0 ? "out-of-stock" : ""
                  }`}
                >
                  <div className="cake-image-container">
                    <img
                      src={`http://localhost:5000/uploads/${item.image}`}
                      alt={item.productName}
                      className="cake-image"
                    />
                    {item.qty === 0 && (
                      <div className="out-of-stock-overlay">Out of Stock</div>
                    )}
                  </div>

                  <div className="cake-details">
                    <h3 className="cake-name">{item.productName}</h3>
                    <p className="cake-category">{item.category}</p>
                    <p className="cake-description">{item.description}</p>

                    {/* Toppings Section */}
                    {item.toppings && item.toppings.length > 0 && (
                      <div className="toppings-section">
                        <span className="toppings-label">
                          Available Toppings:
                        </span>
                        <div className="toppings-list">
                          {item.toppings.map((topping, index) => (
                            <span key={index} className="topping-item">
                              {topping.name} (+Rs.{topping.price})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="cake-info">
                      <div className="price-info">
                        <span className="price-label">Price</span>
                        <span className="price-value">Rs{item.price}</span>
                      </div>
                      <div className="quantity-info">
                        <span className="quantity-label">Stock</span>
                        <span
                          className={`quantity-value ${
                            item.qty === 0
                              ? "zero"
                              : item.qty < 5
                              ? "low"
                              : "good"
                          }`}
                        >
                          {item.qty}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="cake-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEditClick(item._id)}
                      title="Edit cake"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() =>
                        handleDeleteClick(item._id, item.productName)
                      }
                      title="Delete cake"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div className="modal-body">
              <div className="warning-icon">⚠️</div>
              <p>
                Are you sure you want to delete{" "}
                <strong>"{deleteModal.cakeName}"</strong>?
              </p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="confirm-delete-btn" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CakeList;
