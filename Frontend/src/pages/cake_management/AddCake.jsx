import React, { useState } from "react";
import "./AddCake.css";
import { assets } from "../../assets/admin_assets/assets.js";
import axios from "axios";
import { toast } from "react-toastify";
import { useStore } from "../../context/StoreContext";

const AddCake = () => {
  const url = "http://localhost:5000/api/cakes";
  const { token } = useStore();
  const [image, setImage] = useState(false);
  const [data, setData] = useState({
    productName: "",
    description: "",
    price: "",
    qty: 1,
    category: "Butter Cake",
  });

  const [toppings, setToppings] = useState([{ name: "", price: "" }]);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const handleToppingChange = (index, field, value) => {
    const updatedToppings = [...toppings];
    updatedToppings[index][field] = value;
    setToppings(updatedToppings);
  };

  const addTopping = () => {
    console.log("Adding new topping");
    console.log("Current toppings before add:", toppings);
    const newToppings = [...toppings, { name: "", price: "" }];
    setToppings(newToppings);
    console.log("New toppings after add:", newToppings);
  };

  const removeTopping = (index) => {
    console.log("Removing topping at index:", index);
    console.log("Current toppings length:", toppings.length);
    if (toppings.length > 1) {
      const updatedToppings = toppings.filter((_, i) => i !== index);
      setToppings(updatedToppings);
      console.log("Updated toppings:", updatedToppings);
    } else {
      console.log("Cannot remove - only one topping remains");
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("productName", data.productName);
    formData.append("description", data.description);
    formData.append("price", Number(data.price));
    formData.append("qty", Number(data.qty));
    formData.append("category", data.category);
    formData.append("image", image);

    // Filter out empty toppings and format them
    const validToppings = toppings.filter(
      (topping) => topping.name.trim() && topping.price
    );
    if (validToppings.length > 0) {
      formData.append(
        "toppings",
        JSON.stringify(
          validToppings.map((topping) => ({
            name: topping.name.trim(),
            price: Number(topping.price),
          }))
        )
      );
    }

    try {
      const response = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (response.data.success) {
        setData({
          productName: "",
          description: "",
          price: "",
          qty: 1,
          category: "Butter Cake",
        });
        setToppings([{ name: "", price: "" }]);
        setImage(false);
        toast.success("Cake added successfully!");
      }
    } catch (error) {
      console.error("Error adding cake:", error);
      if (error?.response?.status === 401) {
        toast.error("Unauthorized. Please log in as admin to add.");
      } else if (error?.response?.status === 403) {
        toast.error("Forbidden. Admin role required to add.");
      } else {
        toast.error(error.response?.data?.message || "Error adding cake");
      }
    }
  };

  return (
    <div className="add-cake-container">
      <div className="add-cake-header">
        <h1 className="add-cake-title">Add New Cake</h1>
        <p className="add-cake-subtitle">
          Create a delicious new addition to your menu
        </p>
      </div>

      <form className="add-cake-form" onSubmit={onSubmitHandler}>
        <div className="form-grid">
          {/* Image Upload Section */}
          <div className="image-upload-section">
            <h3 className="section-title">Cake Image</h3>
            <div className="image-upload-container">
              <label htmlFor="image" className="image-upload-label">
                {image ? (
                  <div className="image-preview">
                    <img src={URL.createObjectURL(image)} alt="Cake preview" />
                    <div className="image-overlay">
                      <span>Click to change</span>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <img src={assets.upload_area} alt="Upload" />
                    <h4>Upload Cake Image</h4>
                    <p>Click here or drag & drop your image</p>
                  </div>
                )}
              </label>
              <input
                onChange={(e) => setImage(e.target.files[0])}
                type="file"
                id="image"
                accept="image/*"
                hidden
                required
              />
            </div>
          </div>

          {/* Form Fields Section */}
          <div className="form-fields-section">
            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Product Name</span>
                <span className="required">*</span>
              </label>
              <input
                onChange={onChangeHandler}
                value={data.productName}
                type="text"
                name="productName"
                placeholder="Enter cake name"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                onChange={onChangeHandler}
                value={data.description}
                name="description"
                rows="4"
                placeholder="Describe your cake..."
                className="form-textarea"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-text">Category</span>
                  <span className="required">*</span>
                </label>
                <select
                  onChange={onChangeHandler}
                  value={data.category}
                  name="category"
                  className="form-select"
                  required
                >
                  <option value="Butter Cake">Butter Cake</option>
                  <option value="Chocolate Cake">Chocolate Cake</option>
                  <option value="Fruit Cake">Fruit Cake</option>
                  <option value="Cheese Cake">Cheese Cake</option>
                  <option value="Theme Cake">Theme Cake</option>
                  <option value="Birthday Cake">Birthday Cake</option>
                  <option value="Gateau">Gateau</option>
                  <option value="Coffee">Coffee Cake</option>
                  <option value="Cup Cake">Cup Cake</option>
                  <option value="Donut">Donut</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-text">Price</span>
                  <span className="required">*</span>
                </label>
                <div className="input-with-prefix">
                  <span className="input-prefix">Rs.</span>
                  <input
                    onChange={onChangeHandler}
                    value={data.price}
                    type="number"
                    name="price"
                    placeholder="0.00"
                    className="form-input with-prefix"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-text">Quantity</span>
                  <span className="required">*</span>
                </label>
                <input
                  onChange={onChangeHandler}
                  value={data.qty}
                  type="number"
                  name="qty"
                  placeholder="1"
                  className="form-input"
                  required
                  min="1"
                />
              </div>
            </div>

            {/* Toppings Section */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Available Toppings</span>
                <span className="optional">(Optional)</span>
              </label>
              <div className="toppings-container">
                {toppings.map((topping, index) => (
                  <div key={index} className="topping-row">
                    <input
                      type="text"
                      placeholder="Topping name (e.g., Chocolate Chips)"
                      value={topping.name}
                      onChange={(e) =>
                        handleToppingChange(index, "name", e.target.value)
                      }
                      className="form-input topping-name"
                    />
                    <div className="input-with-prefix topping-price">
                      <span className="input-prefix">Rs.</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={topping.price}
                        onChange={(e) =>
                          handleToppingChange(index, "price", e.target.value)
                        }
                        className="form-input with-prefix"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTopping(index)}
                      className="remove-topping-btn"
                      disabled={toppings.length === 1}
                      title={
                        toppings.length === 1
                          ? "Cannot remove the last topping"
                          : "Remove this topping"
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTopping}
                  className="add-topping-btn"
                >
                  + Add Topping
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">
            <span className="btn-icon">+</span>
            Add Cake to Menu
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCake;
