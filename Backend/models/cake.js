// models/Cake.js
const mongoose = require("mongoose");

const toppingSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 }
});

const cakeSchema = new mongoose.Schema({
  productName: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  qty: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String }, // will store image file path
  toppings: [toppingSchema], // Array of available toppings for this cake
  averageRating: { type: Number, default: 0 },
  ratingsCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Cake", cakeSchema);
