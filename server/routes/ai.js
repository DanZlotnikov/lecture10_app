import express from 'express';
import pool from '../db/index.js';

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL   = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

router.post('/search', async (req, res) => {
  const { query } = req.body;
  if (!query?.trim()) return res.status(400).json({ error: 'Query is required' });

  try {
    const [events] = await pool.execute(
      `SELECT e.id, e.title, e.description, e.lat, e.lng, e.event_date, e.category, u.username AS creator_name
       FROM events e
       JOIN users u ON e.creator_id = u.id
       ORDER BY e.event_date ASC`
    );

    const eventsContext = events.length
      ? events.map(e =>
          `[ID:${e.id}] "${e.title}" | Category: ${e.category} | Date: ${new Date(e.event_date).toLocaleString()} | Location: (${parseFloat(e.lat).toFixed(4)}, ${parseFloat(e.lng).toFixed(4)}) | By: ${e.creator_name} | Desc: "${e.description || 'none'}"`
        ).join('\n')
      : 'No events currently in the database.';

    const prompt = `You are an event-finder assistant for a map-based event platform.

Current events in the database:
${eventsContext}

User is searching for: "${query.trim()}"

Find the most relevant events and explain why they match. List matched event IDs so the user can locate them on the map.
If no events match well, say so and suggest what kinds of events could be added. Keep your response concise and friendly.`;

    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!geminiRes.ok) {
      const text = await geminiRes.text();
      throw new Error(`Gemini error ${geminiRes.status}: ${text}`);
    }

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response from Gemini.';
    res.json({ response: text });
  } catch (err) {
    console.error('AI error:', err.message);
    res.status(500).json({ error: `AI service unavailable: ${err.message}` });
  }
});

export default router;
