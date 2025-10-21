const Cart = require('../models/cart');
const Cake = require('../models/cake');

// Get cart for a user
exports.getCart = async (req, res) => {
	try {
		const cart = await Cart.findOne({ user: req.user.id }).populate('items.cake');
		if (!cart) {
			return res.json({ items: [], total: 0 });
		}
		console.log('Cart data:', JSON.stringify(cart, null, 2));
		res.json(cart);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

// Add item to cart
exports.addToCart = async (req, res) => {
	const { cakeId, quantity, toppings = [] } = req.body;
	console.log('Add to cart request:', { cakeId, quantity, toppings });
	if (!cakeId || !quantity || quantity < 1) return res.status(400).json({ message: 'Invalid input' });
	try {
		const cake = await Cake.findById(cakeId);
		if (!cake) return res.status(404).json({ message: 'Cake not found' });
		if (cake.qty < quantity) return res.status(400).json({ message: 'Not enough stock' });

		// Calculate toppings price
		const toppingsPrice = toppings.reduce((sum, topping) => sum + (topping.price || 0), 0);
		const totalPrice = (cake.price + toppingsPrice) * quantity;
		console.log('Calculated prices:', { cakePrice: cake.price, toppingsPrice, totalPrice });

		let cart = await Cart.findOne({ user: req.user.id });
		if (!cart) cart = new Cart({ user: req.user.id, items: [], total: 0 });

		// Check if same cake with same toppings already exists
		const itemIndex = cart.items.findIndex(item => {
			if (!item.cake.equals(cakeId)) return false;
			// Compare toppings arrays
			if (item.toppings.length !== toppings.length) return false;
			return item.toppings.every((itemTopping, index) => 
				itemTopping.name === toppings[index]?.name && 
				itemTopping.price === toppings[index]?.price
			);
		});

		if (itemIndex > -1) {
			cart.items[itemIndex].quantity += quantity;
			cart.items[itemIndex].totalPrice = (cake.price + cart.items[itemIndex].toppingsPrice) * cart.items[itemIndex].quantity;
		} else {
			cart.items.push({ 
				cake: cakeId, 
				quantity, 
				price: cake.price,
				toppings,
				toppingsPrice,
				totalPrice
			});
		}
		cart.total = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
		await cart.save();
		console.log('Saved cart:', JSON.stringify(cart, null, 2));
		res.json(cart);
	} catch (err) {
		console.error('Add to cart error:', err);
		res.status(500).json({ message: err.message });
	}
};

// Update item quantity in cart
exports.updateCartItem = async (req, res) => {
	const { cakeId, quantity } = req.body;
	if (!cakeId || !quantity || quantity < 1) return res.status(400).json({ message: 'Invalid input' });
	try {
		const cake = await Cake.findById(cakeId);
		if (!cake) return res.status(404).json({ message: 'Cake not found' });
		if (cake.qty < quantity) return res.status(400).json({ message: 'Not enough stock' });

    const cart = await Cart.findOne({ user: req.user.id });
		if (!cart) return res.status(404).json({ message: 'Cart not found' });
		const itemIndex = cart.items.findIndex(item => item.cake.equals(cakeId));
		if (itemIndex === -1) return res.status(404).json({ message: 'Item not in cart' });
		
		cart.items[itemIndex].quantity = quantity;
		cart.items[itemIndex].totalPrice = (cake.price + cart.items[itemIndex].toppingsPrice) * quantity;
		cart.total = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
		await cart.save();
		res.json(cart);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

// Remove item from cart
exports.removeCartItem = async (req, res) => {
	const { cakeId } = req.body;
	if (!cakeId) return res.status(400).json({ message: 'Invalid input' });
	try {
    const cart = await Cart.findOne({ user: req.user.id });
		if (!cart) return res.status(404).json({ message: 'Cart not found' });
		cart.items = cart.items.filter(item => !item.cake.equals(cakeId));
		cart.total = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
		await cart.save();
		res.json(cart);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};
