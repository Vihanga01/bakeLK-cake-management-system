const express = require("express");
const dotenv = require("dotenv");
// Load environment variables before importing any modules that read them
dotenv.config();
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");
const sessionSetup = require('./config/session');
const authRoutes = require('./routes/authRoutes');
const cakeRoutes = require('./routes/cakeRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const walletRoutes = require('./routes/walletRoutes');
const commentRoutes = require('./routes/commentRoutes');
const loyaltyRoutes = require('./routes/loyaltyRoutes');

// Connect to MongoDB
connectDB();

const app = express();
app.use(express.json());
sessionSetup(app);
app.use(cors());

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use('/api/auth', authRoutes);
app.use('/api/cakes', cakeRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/loyalty', loyaltyRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));