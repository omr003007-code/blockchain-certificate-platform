const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const { contract } = require('../blockchain');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Middleware to verify Admin JWT Token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });
  try {
    const verified = jwt.verify(token, 'supersecretkey123'); // Match your auth.js secret
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Issue Certificate Route
router.post('/issue', verifyToken, async (req, res) => {
  try {
    const { recipientName, recipientEmail, courseName, expirationDate } = req.body;

    // 1. Generate a unique Certificate ID
    const certificateId = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 2. Convert expiration date to Unix timestamp (seconds) for the blockchain
    const expirationTimestamp = Math.floor(new Date(expirationDate).getTime() / 1000);

    console.log(`🔗 Issuing certificate ${certificateId} on blockchain...`);

    // 3. Call the Smart Contract to issue the certificate
    const tx = await contract.issueCertificate(
      certificateId,
      recipientName,
      courseName,
      expirationTimestamp,
      "ipfs://pending-pdf-hash" 
    );
    
    const receipt = await tx.wait();
    console.log(`✅ Blockchain transaction confirmed: ${receipt.hash}`);

    // 4. Generate QR Code (contains the verification URL + Certificate ID)
    const verificationUrl = `http://localhost:3000/verify?id=${certificateId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

        // 5. Generate Professional PDF Certificate
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const pdfPath = path.join(__dirname, `../certificates/${certificateId}.pdf`);
    
    if (!fs.existsSync(path.join(__dirname, '../certificates'))) {
      fs.mkdirSync(path.join(__dirname, '../certificates'));
    }

    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    const width = doc.page.width;
    const height = doc.page.height;

    // Draw Gold Border
    doc.lineWidth(4);
    doc.rect(20, 20, width - 40, height - 40).stroke('#D4AF37'); 
    doc.lineWidth(1);
    doc.rect(28, 28, width - 56, height - 56).stroke('#D4AF37'); 

    // Header (UPDATED)
    doc.fillColor('#333333');
    doc.font('Times-Roman').fontSize(14).text('Kirirom Institute of Technology', 0, 60, { align: 'center' });
    
    doc.font('Times-Bold').fontSize(36).text('CERTIFICATE OF COMPLETION', 0, 100, { align: 'center' });
    doc.moveTo(width / 2 - 100, 145).lineTo(width / 2 + 100, 145).strokeColor('#D4AF37').lineWidth(2).stroke();

    // Body Text
    doc.fillColor('#555555').font('Times-Roman').fontSize(16).text('This is to certify that', 0, 180, { align: 'center' });
    doc.fillColor('#000000').font('Times-Bold').fontSize(32).text(recipientName, 0, 220, { align: 'center' });
    doc.fillColor('#555555').font('Times-Roman').fontSize(16).text('has successfully completed the course', 0, 280, { align: 'center' });
    doc.fillColor('#003366').font('Times-Bold').fontSize(24).text(courseName, 0, 310, { align: 'center' });

    // Footer (UPDATED: Removed signature, moved ID to left, removed Expires)
    doc.fillColor('#333333').font('Helvetica').fontSize(10).text(`Certificate ID: ${certificateId}`, 150, 420, { width: 250, align: 'left' });
    doc.text(`Issued: ${new Date().toLocaleDateString()}`, 150, 435, { width: 250, align: 'left' });

    // QR Code (Right side)
    const qrImageBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
    doc.image(qrImageBuffer, 620, 380, { width: 90, height: 90 });
    doc.fillColor('#777777').font('Helvetica').fontSize(8).text('Scan to Verify', 620, 475, { width: 90, align: 'center' });

    doc.end();

    await new Promise(resolve => stream.on('finish', resolve));
    const pdfUrl = `/certificates/${certificateId}.pdf`;

    // 6. Save to MongoDB
    const newCertificate = new Certificate({
      certificateId,
      recipientName,
      recipientEmail,
      courseName,
      expirationDate: new Date(expirationDate),
      issuedBy: req.user.id,
      txHash: receipt.hash,
      status: 'Valid'
    });
    await newCertificate.save();

    // 7. Send Email Notification
    // NOTE: For the demo, we use a mock transporter. Replace with real SMTP (e.g., Gmail) if required.
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your preferred email service
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: recipientEmail,
      subject: `Your Digital Certificate for ${courseName}`,
      text: `Congratulations ${recipientName}! Your certificate has been issued.\n\nCertificate ID: ${certificateId}\nVerify it here: ${verificationUrl}\n\nBlockchain TX: ${receipt.hash}`,
      attachments: [{ filename: `${certificateId}.pdf`, path: pdfPath }]
    };

    // Try to send email, but don't crash the API if email fails (e.g., missing credentials)
    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${recipientEmail}`);
    } catch (emailError) {
      console.log('⚠️ Email failed to send (check EMAIL_USER/EMAIL_PASS in .env), but certificate was issued.');
    }

    res.status(201).json({ 
      message: 'Certificate issued, PDF generated, and email sent!', 
      certificateId,
      txHash: receipt.hash,
      pdfUrl
    });

  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({ error: 'Failed to issue certificate', details: error.message });
  }
});

// Public Verification Route (Using Database + Blockchain Proof)
router.get('/verify/:certId', async (req, res) => {
  try {
    const { certId } = req.params;
    console.log(` Verifying certificate: ${certId}`);

    // 1. Check the MongoDB database
    const cert = await Certificate.findOne({ certificateId: certId });

    if (!cert) {
      return res.status(404).json({ 
        status: "Not Found", 
        message: "Certificate ID does not exist." 
      });
    }

    // 2. Return the data along with the Blockchain Transaction Hash as proof
    res.status(200).json({
      status: cert.status, // "Valid", "Revoked", etc.
      certificateId: cert.certificateId,
      recipientName: cert.recipientName,
      courseName: cert.courseName,
      issuedBy: cert.issuedBy,
      issueDate: new Date(cert.createdAt).toLocaleDateString(),
      expirationDate: new Date(cert.expirationDate).toLocaleDateString(),
      blockchainProof: cert.txHash, // This proves it's on the blockchain!
      message: "Certificate successfully verified!"
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      status: "Error", 
      message: "An error occurred during verification." 
    });
  }
});

module.exports = router;

