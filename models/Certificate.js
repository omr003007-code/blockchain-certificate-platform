const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateId: { type: String, required: true, unique: true },
  recipientName: { type: String, required: true },
  recipientEmail: { type: String, required: true },
  courseName: { type: String, required: true },
  issueDate: { type: Date, default: Date.now },
  expirationDate: { type: Date, required: true },
  status: { type: String, enum: ['Valid', 'Expired', 'Revoked'], default: 'Valid' },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  txHash: { type: String }, // Blockchain transaction hash
  pdfUrl: { type: String }  // Link to the generated PDF
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);