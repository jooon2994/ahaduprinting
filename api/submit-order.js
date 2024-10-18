// api/submit-order.js
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');

// Create express app instance
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /doc|docx|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Only .doc, .docx, or .pdf files are allowed!');
    }
  }
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',  // You can use any email service (Gmail, Outlook, etc.)
  auth: {
    user: 'wizyoni7@gmail.com',  // Your email
    pass: '2321271630@wW'    // Your email password (consider using an app password or env variable for security)
  }
});

// API route to handle multiple file uploads and send email
app.post('/api/submit-order', upload.array('files', 10), (req, res) => {
  const { phoneNumber, additionalInfo } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required.' });
  }

  // Create email options
  let mailOptions = {
    from: 'wizyoni7@gmail.com',
    to: 'Yohannisaweke29@gmail.com',  // Your email (where you want to receive the order)
    subject: 'New Print Order Received',
    text: `Phone Number: ${phoneNumber}\nAdditional Info: ${additionalInfo || 'None'}`,
    attachments: files.map(file => ({
      filename: file.originalname,
      path: file.path
    }))
  };

  // Send the email with the uploaded files attached
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    // Success response
    res.status(200).json({
      message: 'Order submitted successfully and email sent!',
      phoneNumber,
      additionalInfo,
      files: files.map(f => f.filename)
    });
  });
});

module.exports = app;
