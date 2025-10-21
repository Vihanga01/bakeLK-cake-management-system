const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Order = require('../models/Order');
const Cart = require('../models/cart');
const Cake = require('../models/cake');
const { verifyJWT } = require('../middleware/authJwt');
const { sendOrderConfirmationEmail } = require('../utils/mailer');
const { addPointsAfterOrder, calculatePoints } = require('../controllers/loyaltyController');
const { clearPopularCakesCache } = require('../controllers/popularCakesController');

const router = express.Router();

// Ensure receipts directory exists
const receiptsDir = path.join(__dirname, '..', 'uploads', 'receipts');
fs.mkdirSync(receiptsDir, { recursive: true });

// Multer storage for receipt uploads
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, receiptsDir);
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		const ext = path.extname(file.originalname) || '.png';
		cb(null, `receipt-${uniqueSuffix}${ext}`);
	}
});

const fileFilter = (req, file, cb) => {
	const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
	if (allowed.includes(file.mimetype)) return cb(null, true);
	cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/orders - create new order
router.post('/', verifyJWT, upload.single('receiptImage'), async (req, res) => {
	try {
		const {
			customerName,
			address,
			city,
			postalCode,
			contactNumber,
			email,
			paymentMethod,
			referenceNumber,
		} = req.body;

		if (!customerName || !address || !city || !postalCode || !contactNumber || !email || !paymentMethod) {
			return res.status(400).json({ message: 'Missing required fields' });
		}

		if (!['COD', 'BankTransfer'].includes(paymentMethod)) {
			return res.status(400).json({ message: 'Invalid payment method' });
		}

		if (paymentMethod === 'BankTransfer') {
			if (!referenceNumber) {
				return res.status(400).json({ message: 'Reference number is required for bank transfer' });
			}
			if (!req.file) {
				return res.status(400).json({ message: 'Receipt image is required for bank transfer' });
			}
		}

		// Load user's cart
		const cart = await Cart.findOne({ user: req.user.id }).populate('items.cake');
		if (!cart || cart.items.length === 0) {
			return res.status(400).json({ message: 'Cart is empty' });
		}

		// Check stock availability before creating order
		const stockIssues = [];
		for (const item of cart.items) {
			const cake = await Cake.findById(item.cake._id);
			if (!cake) {
				stockIssues.push(`${item.cake.productName} is no longer available`);
			} else if (cake.qty < item.quantity) {
				stockIssues.push(`${cake.productName}: Only ${cake.qty} available, but ${item.quantity} requested`);
			}
		}

		if (stockIssues.length > 0) {
			return res.status(400).json({ 
				message: 'Stock issues detected', 
				issues: stockIssues 
			});
		}

		const orderedItems = cart.items.map((item) => ({
			cake: item.cake._id,
			name: item.cake.productName,
			quantity: item.quantity,
			price: item.price,
		}));

		// Calculate total amount
		const totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
		
		// Calculate points earned
		const pointsEarned = calculatePoints(totalAmount);

		const receiptRelativePath = req.file ? path.join('uploads', 'receipts', req.file.filename) : undefined;

		const order = await Order.create({
			user: req.user.id,
			customerName,
			address,
			city,
			postalCode,
			contactNumber,
			email,
			paymentMethod,
			receiptImage: receiptRelativePath,
			referenceNumber: referenceNumber || undefined,
			orderedItems,
			orderStatus: 'Pending',
			totalAmount,
			pointsEarned,
		});

		// Reduce inventory for each ordered item
		for (const item of cart.items) {
			const cake = await Cake.findById(item.cake._id);
			if (cake) {
				if (cake.qty >= item.quantity) {
					cake.qty -= item.quantity;
					await cake.save();
					console.log(`Reduced inventory for ${cake.productName}: ${cake.qty + item.quantity} → ${cake.qty}`);
				} else {
					console.error(`Insufficient stock for ${cake.productName}. Available: ${cake.qty}, Required: ${item.quantity}`);
					// You might want to handle this case differently (e.g., cancel order or partial fulfillment)
				}
			} else {
				console.error(`Cake not found: ${item.cake._id}`);
			}
		}

		// Optionally clear the cart after order placement
		cart.items = [];
		cart.total = 0;
		await cart.save();

		// Add loyalty points after successful order creation
		if (pointsEarned > 0) {
			console.log(`Awarding ${pointsEarned} points to user ${req.user.id} for order ${order._id}`);
			await addPointsAfterOrder(req.user.id, totalAmount);
		} else {
			console.log(`No points earned for order ${order._id} (total: ${totalAmount})`);
		}

		// Clear popular cakes cache since order data has changed
		clearPopularCakesCache();

		if (paymentMethod === 'COD') {
			// Fire-and-forget email (do not block response)
			sendOrderConfirmationEmail({
				toEmail: email,
				customerName,
				orderId: order._id,
				items: orderedItems,
				paymentMethod,
			}).catch((e) => console.error('Email error:', e.message));

			return res.status(201).json({
				message: 'Order placed successfully! Your order will be delivered soon.',
				orderId: order._id,
			});
		} else {
			// Fire-and-forget email
			sendOrderConfirmationEmail({
				toEmail: email,
				customerName,
				orderId: order._id,
				items: orderedItems,
				paymentMethod,
			}).catch((e) => console.error('Email error:', e.message));

			return res.status(201).json({
				message: 'Receipt uploaded successfully! We will verify your payment and confirm your order.',
				orderId: order._id,
				receiptImage: order.receiptImage,
			});
		}
	} catch (err) {
		console.error('Create order error:', err);
		if (err instanceof multer.MulterError) {
			return res.status(400).json({ message: err.message });
		}
		return res.status(500).json({ message: 'Failed to create order' });
	}
});

// GET /api/orders - fetch all orders for current user
router.get('/', verifyJWT, async (req, res) => {
	try {
		const orders = await Order.find({ user: req.user.id })
			.populate('orderedItems.cake')
			.sort({ createdAt: -1 });
		return res.json({ success: true, orders });
	} catch (err) {
		console.error('Get orders error:', err);
		return res.status(500).json({ message: 'Failed to fetch orders' });
	}
});

// GET /api/orders/:id - fetch order details
router.get('/:id', verifyJWT, async (req, res) => {
	try {
		const order = await Order.findOne({ _id: req.params.id, user: req.user.id })
			.populate('orderedItems.cake');
		if (!order) return res.status(404).json({ message: 'Order not found' });
		return res.json(order);
	} catch (err) {
		console.error('Get order error:', err);
		return res.status(500).json({ message: 'Failed to fetch order' });
	}
});

module.exports = router;


