const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyJWT } = require('../middleware/authJwt');
const { addComment, getCommentsByCake, updateComment, deleteComment, toggleLike, addReply } = require('../controllers/commentController');

const router = express.Router();

// Ensure comment images directory exists
const commentImagesDir = path.join(__dirname, '..', 'uploads', 'comment-images');
fs.mkdirSync(commentImagesDir, { recursive: true });

// Multer storage for comment image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, commentImagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `comment-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/:cakeId', getCommentsByCake);
router.post('/', verifyJWT, upload.single('commentImage'), addComment);
router.put('/:id', verifyJWT, updateComment);
router.delete('/:id', verifyJWT, deleteComment);
router.patch('/like/:id', verifyJWT, toggleLike);
router.post('/reply/:id', verifyJWT, addReply);

module.exports = router;


