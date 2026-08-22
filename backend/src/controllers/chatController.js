const { sendChatMessage } = require('../services/geminiChat');

const MAX_MESSAGE_LENGTH = 1000;

async function chat(req, res) {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'message is required' });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: `message must be ${MAX_MESSAGE_LENGTH} characters or fewer` });
    }

    const reply = await sendChatMessage({ message: message.trim(), history });
    res.json({ reply });
  } catch (err) {
    console.error('Chat request failed:', err);
    res.status(500).json({ message: 'Chat request failed', error: err.message });
  }
}

module.exports = { chat };
