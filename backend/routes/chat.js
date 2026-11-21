// Placeholder chat route so server.js can start.
// The new frontend chat runs fully in the browser; replace this with your own
// implementation if you want server-side replies.
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ success: true, message: 'MindCare chat API is running' }));

router.post('/message', (req, res) => {
    const text = String((req.body && req.body.message) || '').trim();
    if (!text) return res.status(400).json({ success: false, message: 'message is required' });
    res.json({ success: true, reply: "Thanks for sharing. I'm here to listen — tell me more about how you're feeling." });
});

module.exports = router;
