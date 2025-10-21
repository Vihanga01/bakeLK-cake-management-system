const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  addCake,
  getAllCakes,
  getCakeById,
  updateCake,
  deleteCake
} = require("../controllers/cakeController");
const { getPopularCakesHandler } = require("../controllers/popularCakesController");
const { verifyJWT, requireAdmin } = require("../middleware/authJwt");

const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (only images, 5MB limit)
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Multer error handler
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "Image size exceeds 5MB" });
    }
  }
  if (err.message === "Only image files are allowed") {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};

// Routes
// Public routes (no authentication required)
router.get("/", getAllCakes);
router.get("/popular", getPopularCakesHandler);
router.get("/:id", getCakeById);

// Admin routes (authentication and admin role required)
router.post("/", verifyJWT, requireAdmin, upload.single("image"), handleUploadError, addCake);
router.patch("/:id", verifyJWT, requireAdmin, upload.single("image"), handleUploadError, updateCake);
router.delete("/:id", verifyJWT, requireAdmin, deleteCake);

module.exports = router;
