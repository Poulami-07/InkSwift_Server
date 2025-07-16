
import express from "express";
import userAuth from "../middleware/userAuth.js";
import { saveSignature,generateSignedPDF, sendSignatureLink, verifySignatureToken, updateSignatureStatus,verifyDocumentSignatures} from '../controllers/signController.js'
import logIp from "../middleware/ipLogger.js";



const router = express.Router();

router.use(logIp);
router.post("/", userAuth, saveSignature); // Save signature coordinates
router.post("/generate-signed-pdf", userAuth, generateSignedPDF); // Generate signed PDF
router.post("/send-link", userAuth, sendSignatureLink);
router.get("/external-sign/:token", verifySignatureToken);// NEW route to verify the token
router.put("/:signatureId/status", userAuth, updateSignatureStatus);


export default router;
