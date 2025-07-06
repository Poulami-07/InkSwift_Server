import express from "express";
import { upload } from "../middleware/multerConfig.js";
import { getUserDocuments, uploadPDF } from "../controllers/docController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

router.post("/uploads", userAuth, upload.single("pdf"), uploadPDF);
router.get("/my-docs", userAuth, getUserDocuments);

export default router;
