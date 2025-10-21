const mongoose = require('mongoose');

const toppingSchema = new mongoose.Schema({
	name: { type: String, required: true },
	price: { type: Number, required: true, min: 0 }
});

const cartItemSchema = new mongoose.Schema({
	cake: { type: mongoose.Schema.Types.ObjectId, ref: 'Cake', required: true },
	quantity: { type: Number, required: true, min: 1 },
	price: { type: Number, required: true, min: 0 }, // snapshot price
	toppings: [toppingSchema], // selected toppings
	toppingsPrice: { type: Number, default: 0 }, // total toppings price
	totalPrice: { type: Number, required: true, min: 0 } // (price + toppingsPrice) * quantity
});

const cartSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	items: [cartItemSchema],
	total: { type: Number, required: true, min: 0, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
