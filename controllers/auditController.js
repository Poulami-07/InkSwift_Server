import signModel from '../models/signModel.js';
import userModel from '../models/userModel.js';

export const getAuditTrail = async (req, res) => {
  try {
    const { fileId } = req.params;

    const audit = await signModel.find({ fileId })
      .populate('signer', 'name email')
      .select('signer ip createdAt');

    res.json({ success: true, audit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
