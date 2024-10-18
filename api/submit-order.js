const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Initialize Express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer setup for file uploads
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

const upload = multer({ storage });

// Nodemailer setup (replace with your email info or environment variables)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',  // Your email or use environment variable
    pass: process.env.EMAIL_PASS || 'your-email-password'    // Your email password or use environment variable
  }
});

// Serve static files (Frontend)
app.use(express.static('public'));

// API route to handle file uploads and form submission
app.post('/api/submit-order', upload.array('files', 10), (req, res) => {
  const { phoneNumber, additionalInfo } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required.' });
  }

  // Email configuration
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
    to: 'your-email@gmail.com',  // Replace with your receiving email
    subject: 'New Print Order Received',
    text: `Phone Number: ${phoneNumber}\nAdditional Info: ${additionalInfo || 'None'}`,
    attachments: files.map(file => ({
      filename: file.originalname,
      path: file.path
    }))
  };

  // Send email with the uploaded files attached
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    res.status(200).json({
      message: 'Order submitted successfully and email sent!',
      phoneNumber,
      additionalInfo,
      files: files.map(f => f.filename)
    });
  });
});

// Serve index.html for root route "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Start server on Railway's provided port (or 3000 locally)
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
