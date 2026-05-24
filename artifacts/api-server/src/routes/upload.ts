import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate, type AuthRequest } from "../middleware/authenticate";

const router = Router();

// Ensure upload directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.post("/upload", authenticate, upload.single("file"), (req: AuthRequest, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Bad Request", message: "No file uploaded" });
    return;
  }

  // Return the file path that can be served statically
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ url: filePath });
});

export default router;
