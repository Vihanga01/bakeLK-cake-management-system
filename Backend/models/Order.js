const mongoose = require('mongoose');

const orderedItemSchema = new mongoose.Schema({
	cake: { type: mongoose.Schema.Types.ObjectId, ref: 'Cake', required: true },
	name: { type: String, required: true },
	quantity: { type: Number, required: true, min: 1 },
	price: { type: Number, required: true, min: 0 },
});

const orderSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	customerName: { type: String, required: true },
	address: { type: String, required: true },
	city: { type: String, required: true },
	postalCode: { type: String, required: true },
	contactNumber: { type: String, required: true },
	email: { type: String, required: true },
	paymentMethod: { type: String, enum: ['COD', 'BankTransfer'], required: true },
	receiptImage: { type: String },
	referenceNumber: { type: String },
	orderedItems: [orderedItemSchema],
	orderStatus: { type: String, enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
	totalAmount: { type: Number, required: true },
	pointsEarned: { type: Number, default: 0 },
	discountApplied: { type: Number, default: 0 },
	pointsRedeemed: { type: Number, default: 0 }
}, { timestamps: { createdAt: true, updatedAt: true } });

module.exports = mongoose.model('Order', orderSchema);


