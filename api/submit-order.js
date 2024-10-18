const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Express setup
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Multer for multiple file uploads
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

// Nodemailer setup (use environment variables for security)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// API route to handle file uploads and form data
app.post('/api/submit-order', upload.array('files', 10), (req, res) => {
  const { phoneNumber, additionalInfo } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required.' });
  }

  // Compose the email options
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'your-email@gmail.com',  // Your email
    subject: 'New Print Order Received',
    text: `Phone Number: ${phoneNumber}\nAdditional Info: ${additionalInfo || 'None'}`,
    attachments: files.map(file => ({
      filename: file.originalname,
      path: file.path
    }))
  };

  // Send the email with attached files
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    res.status(200).json({
      message: 'Order submitted successfully, and email sent!',
      phoneNumber,
      additionalInfo,
      files: files.map(f => f.filename)
    });
  });
});

// Serve static files
app.use(express.static('public'));

// Start the server on the port provided by Railway (or fallback to 3000)
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
