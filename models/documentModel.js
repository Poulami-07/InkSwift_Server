import mongoose from "mongoose";


const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
},{ timestamps: true });

export default mongoose.models.document || mongoose.model("document", documentSchema);
