// models/Cake.js
const mongoose = require("mongoose");
const { sendLowStockNotificationEmail } = require("../utils/mailer");

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

// Pre-save hook to check quantity and send email notification
cakeSchema.pre('save', async function(next) {
  // Only check if this is an update operation and qty field is being modified
  if (!this.isNew && this.isModified('qty')) {
    const previousDoc = await this.constructor.findById(this._id);
    
    // Check if quantity is below 5 and was previously above 5
    if (this.qty < 5 && (!previousDoc || previousDoc.qty >= 5)) {
      try {
        await sendLowStockNotificationEmail({
          productName: this.productName,
          description: this.description,
          qty: this.qty,
          category: this.category,
          price: this.price,
          image: this.image
        });
        console.log(`Low stock email sent for ${this.productName} (${this.qty} units remaining)`);
      } catch (error) {
        console.error('Error sending low stock notification email:', error);
        // Don't block the save operation if email fails
      }
    }
  }
  
  // Also check for new cakes with low quantity
  if (this.isNew && this.qty < 5) {
    try {
      await sendLowStockNotificationEmail({
        productName: this.productName,
        description: this.description,
        qty: this.qty,
        category: this.category,
        price: this.price,
        image: this.image
      });
      console.log(`Low stock email sent for new cake ${this.productName} (${this.qty} units remaining)`);
    } catch (error) {
      console.error('Error sending low stock notification email:', error);
      // Don't block the save operation if email fails
    }
  }
  
  next();
});

module.exports = mongoose.model("Cake", cakeSchema);
