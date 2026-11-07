const ContactMessage = require('../models/ContactMessage');

// POST /api/contact - Submit a contact / feedback message
exports.submitMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Name, email, subject, and message are required.' });
    }

    const contactMsg = await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message
    });

    res.status(201).json({
      message: 'Your message has been received! Our team will get back to you shortly.',
      contactMsg
    });
  } catch (error) {
    console.error('Submit contact message error:', error);
    res.status(500).json({ message: 'Server error while sending message' });
  }
};

// GET /api/contact - Get all contact messages (Admin)
exports.getMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching messages' });
  }
};

