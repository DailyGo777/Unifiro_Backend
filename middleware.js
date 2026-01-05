import { rateLimit } from 'express-rate-limit'
import multer from "multer";
import jwt from "jsonwebtoken";

// Error handling middleware
export const errorHandle = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
};

// 404 route handler middleware
export const routeHandler = (req, res) => {
  res.status(404).json({ error: 'Route not found' });
};

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  
  max: 50,                   
  message: {
    status: 429,
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const storage = multer.memoryStorage();

// File filter for PDF/PPTX only
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation" // PPTX
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF or PPTX files are allowed!"), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
  fileFilter: fileFilter,
});

export const authentication = () => {
  return (req, res, next) => {
    const token = req.cookies?.unifiro_token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (!req.user) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};
