import documentModel from "../models/documentModel.js";

export const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const document = await documentModel.create({
      userId: req.userId,
      fileName: req.file.originalname,
      filePath: `uploads/${req.file.filename}` ,
    });

    res.json({ success: true, message: "File uploaded", document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Fetch user's uploaded PDF

export const getUserDocuments = async (req, res) => {
  try {
    const userId = req.userId;
    const documents = await documentModel.find({ userId: userId }).sort({ createdAt: -1 });

    res.json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};