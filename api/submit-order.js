const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

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

// Telegram Bot setup
const TELEGRAM_BOT_TOKEN = '7533561581:AAFFwyb_j8ZNBppySZBtmMl-wSfnkB9SEzs';  // Replace with your Telegram bot token
const CHAT_ID = '1241311689';  // Replace with your Telegram chat ID

// Function to send a message to Telegram
const sendTelegramMessage = async (message) => {
  const telegramURL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(telegramURL, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
};

// Function to send a document (file) to Telegram
const sendTelegramDocument = async (filePath, fileName) => {
  const telegramURL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`;

  const formData = new FormData();
  formData.append('chat_id', CHAT_ID);
  formData.append('document', fs.createReadStream(filePath), fileName);

  try {
    await axios.post(telegramURL, formData, {
      headers: formData.getHeaders()
    });
  } catch (error) {
    console.error('Error sending document to Telegram:', error);
  }
};

// Serve static files (Frontend)
app.use(express.static('public'));

// Serve index.html for the root "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// API route to handle file uploads and form submission
app.post('/api/submit-order', upload.array('files', 10), async (req, res) => {
  const { phoneNumber, additionalInfo } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required.' });
  }

  // Create a message for Telegram
  const message = `
*New Print Order Received*:
- *Phone Number*: ${phoneNumber}
- *Additional Info*: ${additionalInfo || 'None'}
- *Files*: ${files.map(file => file.originalname).join(', ')}
- *Timestamp*: ${new Date().toLocaleString()}
  `;

  // Send the message to Telegram (without files)
  await sendTelegramMessage(message);

  // Send each file to Telegram as a document
  for (const file of files) {
    const filePath = path.join(__dirname, '../uploads', file.filename);
    await sendTelegramDocument(filePath, file.originalname);
  }

  res.status(200).json({
    message: 'Order submitted successfully and sent to Telegram!',
    phoneNumber,
    additionalInfo,
    files: files.map(f => f.filename)
  });
});

// Start server on Railway's provided port (or 3000 locally)
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
