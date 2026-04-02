import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure storage for gallery uploads
const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/gallery');
    
    // Security check: ensure the path is within the intended directory
    const resolvedPath = path.resolve(uploadDir);
    const basePath = path.resolve(path.join(__dirname, '../../uploads'));
    
    if (!resolvedPath.startsWith(basePath)) {
      return cb(new Error('Invalid upload path'), '');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (error) {
        return cb(new Error('Failed to create upload directory'), '');
      }
    }
    
    // Check if directory is writable
    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
    } catch (error) {
      return cb(new Error('Upload directory is not writable'), '');
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and sanitize
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `image-${timestamp}-${random}${ext}`;
    cb(null, safeName);
  }
});

// Configure storage for artist uploads
const artistStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/artists');
    
    // Security check: ensure the path is within the intended directory
    const resolvedPath = path.resolve(uploadDir);
    const basePath = path.resolve(path.join(__dirname, '../../uploads'));
    
    if (!resolvedPath.startsWith(basePath)) {
      return cb(new Error('Invalid upload path'), '');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (error) {
        return cb(new Error('Failed to create upload directory'), '');
      }
    }
    
    // Check if directory is writable
    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
    } catch (error) {
      return cb(new Error('Upload directory is not writable'), '');
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and sanitize
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `artist-${timestamp}-${random}${ext}`;
    cb(null, safeName);
  }
});

// File filter for images only
const fileFilter = (req: any, file: any, cb: any) => {
  // Check file type by extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Only image files (JPEG, PNG, WebP) are allowed!'));
  }
  
  // Check mimetype as additional validation
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type detected!'));
  }
  
  cb(null, true);
};

// Configure multer for gallery uploads
export const galleryUpload = multer({
  storage: galleryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Maximum 1 file per request for gallery
  }
});

// Configure multer for artist uploads
export const artistUpload = multer({
  storage: artistStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Maximum 1 file per request for artist
  }
});

// Single file upload for gallery
export const uploadSingle = galleryUpload.single('image');

// Single file upload for artist
export const uploadArtistImage = artistUpload.single('image');

// Multiple files upload (if needed later)
export const uploadMultiple = galleryUpload.array('images', 10);

// Error handling middleware for multer
export const handleUploadError = (err: any, req: any, res: any, next: any) => {
  console.error('Multer error:', err);
  
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ message: 'Too many files. Only one file allowed.' });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ message: 'Unexpected field name in upload.' });
      default:
        return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};
