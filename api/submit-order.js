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

// Nodemailer setup (using provided Gmail credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'yohannisaweke29@gmail.com',  // Your Gmail address
    pass: '2321271630@wW'               // Your Gmail password (consider switching to App Password)
  }
});

// Serve static files (Frontend)
app.use(express.static('public'));

// Serve index.html for the root "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

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
    from: 'yohannisaweke29@gmail.com',
    to: 'yohannisaweke29@gmail.com',  // Send to yourself (same email)
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

// Start server on Railway's provided port (or 3000 locally)
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
