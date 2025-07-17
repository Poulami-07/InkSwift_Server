
import signModel from "../models/signModel.js";
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import documentModel from '../models/documentModel.js';
import { StandardFonts } from "pdf-lib";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import userModel from "../models/userModel.js";




export const saveSignature = async (req, res) => {
  try {
    const { fileId, x, y, page, name } = req.body;

    if (!fileId || x == null || y == null || page == null || !name?.trim()) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const signature = await signModel.create({
      fileId,
      x,
      y,
      page,
      name,
      signer: req.userId,
      status: 'Signed',
    });

    res.json({ success: true, message: "Signature saved", signature });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const generateSignedPDF = async (req, res) => {
  try {
    const { fileId } = req.body;

    const document = await documentModel.findById(fileId);
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const pdfBytes = fs.readFileSync(path.resolve(document.filePath));
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);



const signatures = await signModel.find({ fileId, status: "Signed" });

signatures.forEach(sig => {
  const pageIndex = Math.min(sig.page || 0, pages.length - 1);
  const page = pages[pageIndex];
  const { width, height } = page.getSize();

  const signatureWidth = 120; // Match what you use in frontend (Resizable)
  const signatureHeight = 50;

  
  const safeX = Math.max(0, Math.min(sig.x, width - signatureWidth));

  const flippedY = height - sig.y - signatureHeight;
  const safeY = Math.max(0, Math.min(flippedY, height - signatureHeight));


  const nameToDraw = sig.name || "Signature";

  page.drawText(nameToDraw, {
    x: safeX,
    y: safeY,
    size: 14,
    font,
    color: rgb(0, 0, 0)
  });


});

    const signedPdfBytes = await pdfDoc.save();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="signed_${document.name || 'document'}.pdf"`,
      'Content-Length': signedPdfBytes.length
    });
    res.send(signedPdfBytes);

  } catch (error) {
    console.error("PDF Generation Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate PDF",
      error: error.message 
    });
  }
};



export const sendSignatureLink = async (req, res) => {
    try {
        const { fileId, email } = req.body;

        const document = await documentModel.findById(fileId);
        if (!document) {
            return res.status(404).json({ success: false, message: "Document not found" });
        }

        const token = jwt.sign({ fileId, email }, process.env.JWT_SECRET, { expiresIn: "1d" });

        const link = `https://ink-swift-client.vercel.app/external-sign/${token}`;



        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"InkSwift" <${process.env.MAIL_USER}>`,
            to: email,
            subject: 'Signature Request - InkSwift',
            html: `
        <p>You have been requested to sign a document.</p>
        <p><strong>Click below to sign:</strong></p>
        <a href="${link}">${link}</a>
        <p>This link will expire in 24 hours.</p>
      `,
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: "Signature link sent", link });
    } catch (err) {
        console.error("Email error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

export const verifySignatureToken = async (req, res) => {
    try {
        const { token } = req.params;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        res.json({
            success: true,
            message: "Token is valid",
            data: {
                fileId: decoded.fileId,
                email: decoded.email
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, message: "Invalid or expired link" });
    }

};


export const updateSignatureStatus = async (req, res) => {
    try {
        const { signatureId } = req.params;
        const { status, reason } = req.body;

        if (!['Signed', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const updated = await signModel.findByIdAndUpdate(signatureId, {
            status,
            reason: status === 'Rejected' ? reason : undefined
        }, { new: true });

        if (!updated) {
            return res.status(404).json({ success: false, message: "Signature not found" });
        }

        res.json({ success: true, message: "Signature updated", signature: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const verifyDocumentSignatures = async (req, res) => {
    try {
        const { fileId } = req.params;

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: "Document ID is required"
            });
        }

        // Check if document exists
        const document = await documentModel.findById(fileId);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        // Check for existing signatures
        const signatures = await signModel.find({ fileId, status: "Signed" });
        const hasSignatures = signatures.length > 0;

        res.json({
            success: true,
            hasSignatures,
            signatureCount: signatures.length,
            documentId: fileId
        });

    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({
            success: false,
            message: "Error verifying signatures",
            error: error.message
        });
    }
};

export const saveExternalSignature = async (req, res) => {
  try {
    const { token } = req.params;
    const { x, y, page, name } = req.body;

    if (!x || !y || page === undefined || !name) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { fileId, email } = decoded;

    const signature = await signModel.create({
      fileId,
      x,
      y,
      page,
      name,     
      email,    // Optional: store email from token
      status: "Signed"
    });

    res.json({ success: true, message: "External signature saved", signature });
  } catch (err) {
    console.error("External signature error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
