import mongoose from "mongoose";

const signatureSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: "document", required: true },
  signer: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  page: { type: Number, required: true }, // which page of PDF
  status: { type: String, enum: ['Pending', 'Signed', 'Rejected'], default: 'Pending' },
  reason: { type: String },
  ip: { type: String },
}, { timestamps: true });

export default mongoose.models.signature || mongoose.model("signature", signatureSchema);
