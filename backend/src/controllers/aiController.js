const Groq = require('groq-sdk');
const Complaint = require('../models/Complaint');
const Society = require('../models/Society');
const AILog = require('../models/AILog');
const { findRelevantChunk } = require('../utils/langchain');

// Lazy-initialize Groq client — free tier, no credit card needed
let _groq = null;
const getGroq = () => {
  if (!_groq && process.env.GROQ_API_KEY) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
};

// Helper: call Groq chat completion
const groqChat = async (messages, maxTokens = 300) => {
  const groq = getGroq();
  if (!groq) throw new Error('No Groq API key');
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile', // free, better than gpt-3.5-turbo
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  return {
    content: completion.choices[0].message.content,
    tokens: completion.usage?.total_tokens,
  };
};

// Helper: log AI interaction
const logAI = async (userId, societyId, type, input, output, tokens, latency) => {
  await AILog.create({ user: userId, society: societyId, type, input, output, tokensUsed: tokens, latencyMs: latency, model: 'llama-3.3-70b-versatile' }).catch(() => {});
};

// POST /api/ai/chat - FAQ + context chatbot
const chat = async (req, res) => {
  const { message, societyId } = req.body;
  const start = Date.now();
  try {
    const society = await Society.findById(societyId);
    const systemPrompt = `You are Panchayat AI, a helpful assistant for "${society?.name || 'this society'}".
Society info: ${society?.address || ''}, ${society?.city || ''}.
Amenities: ${society?.amenities?.join(', ') || 'gym, pool, parking'}.
Maintenance: ₹${society?.maintenanceAmount || 2000}/month.
Rules: ${society?.rules || 'Follow standard society rules. No loud music after 10pm. Pets allowed with registration.'}
Answer resident queries helpfully and concisely. If unsure, ask them to contact the admin.`;

    const { content: reply, tokens } = await groqChat(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }],
      300
    );
    await logAI(req.user._id, societyId, 'chat', message, reply, tokens, Date.now() - start);
    res.json({ success: true, reply });
  } catch {
    const fallback = getFallbackResponse(message);
    res.json({ success: true, reply: fallback, fallback: true });
  }
};

// POST /api/ai/summarize - Drama filter / complaint summarization
const summarize = async (req, res) => {
  const { societyId } = req.body;
  const start = Date.now();
  try {
    const complaints = await Complaint.find({ society: societyId }).select('title category status createdAt');
    if (!complaints.length) return res.json({ success: true, summary: 'No complaints found.' });

    const complaintText = complaints.map(c => `[${c.category}] ${c.title} - ${c.status}`).join('\n');
    const prompt = `Analyze these society complaints and provide a brief insight summary with patterns and suggestions:\n${complaintText}`;

    const { content: summary, tokens } = await groqChat([{ role: 'user', content: prompt }], 400);
    await logAI(req.user._id, societyId, 'summarize', complaintText, summary, tokens, Date.now() - start);
    res.json({ success: true, summary });
  } catch {
    const complaints = await Complaint.find({ society: societyId });
    const counts = complaints.reduce((acc, c) => { acc[c.category] = (acc[c.category] || 0) + 1; return acc; }, {});
    const summary = Object.entries(counts).map(([k, v]) => `${v} complaint(s) about ${k}`).join(', ') || 'No data';
    res.json({ success: true, summary: `Summary: ${summary}`, fallback: true });
  }
};

// POST /api/ai/voice-to-ticket - Convert transcribed text to complaint
const voiceToTicket = async (req, res) => {
  const { transcript, societyId } = req.body;
  const start = Date.now();
  try {
    const prompt = `Extract complaint details from this voice message and return JSON only:
"${transcript}"
Return: {"title": "...", "description": "...", "category": "Plumbing|Electricity|Security|Lift|Parking|Cleanliness|Noise|Other", "priority": "Low|Medium|High|Urgent"}`;

    const { content: raw, tokens } = await groqChat([{ role: 'user', content: prompt }], 200);
    const ticket = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
    await logAI(req.user._id, societyId, 'voice', transcript, raw, tokens, Date.now() - start);
    res.json({ success: true, ticket });
  } catch {
    const ticket = detectCategoryFromText(transcript);
    res.json({ success: true, ticket, fallback: true });
  }
};

// POST /api/ai/bylaw - Answer bylaw/rule queries using vector search when available
const bylawQuery = async (req, res) => {
  const { question, societyId } = req.body;
  const start = Date.now();
  try {
    const society = await Society.findById(societyId);
    if (!society?.rules) return res.json({ success: true, answer: 'No bylaws uploaded yet. Please ask your admin.' });

    let contextText = society.rules;
    if (society.bylawChunks?.length) {
      try {
        const relevantChunk = await findRelevantChunk(question, society.bylawChunks);
        if (relevantChunk) contextText = relevantChunk;
      } catch { /* fallback to full rules */ }
    }

    const prompt = `Society Bylaws (relevant section):\n${contextText}\n\nQuestion: ${question}\nAnswer based only on the bylaws above:`;
    const { content: answer, tokens } = await groqChat([{ role: 'user', content: prompt }], 300);
    await logAI(req.user._id, societyId, 'bylaw', question, answer, tokens, Date.now() - start);
    res.json({ success: true, answer });
  } catch {
    res.status(500).json({ success: false, message: 'AI service unavailable. Please try again.' });
  }
};

// GET /api/ai/logs/:societyId
const getAILogs = async (req, res) => {
  try {
    const logs = await AILog.find({ society: req.params.societyId }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Fallback helpers (no API key needed)
const getFallbackResponse = (message) => {
  const msg = message.toLowerCase();
  if (msg.includes('gym') || msg.includes('timing')) return 'Gym is open from 6 AM to 10 PM daily.';
  if (msg.includes('maintenance') || msg.includes('payment')) return 'Monthly maintenance is due by the 10th of each month.';
  if (msg.includes('parking')) return 'Each flat gets one parking spot. Visitor parking is available near Gate 2.';
  if (msg.includes('pool') || msg.includes('swimming')) return 'Swimming pool is open 7 AM - 8 PM. Children must be accompanied by adults.';
  if (msg.includes('complaint')) return 'You can raise a complaint from the Complaints section in your dashboard.';
  return 'I\'m here to help! Please contact the admin for specific queries or raise a complaint from the dashboard.';
};

const detectCategoryFromText = (text) => {
  const t = text.toLowerCase();
  let category = 'Other';
  if (t.includes('water') || t.includes('pipe') || t.includes('leak') || t.includes('tap')) category = 'Plumbing';
  else if (t.includes('light') || t.includes('power') || t.includes('electric') || t.includes('switch')) category = 'Electricity';
  else if (t.includes('lift') || t.includes('elevator')) category = 'Lift';
  else if (t.includes('park') || t.includes('car') || t.includes('vehicle')) category = 'Parking';
  else if (t.includes('security') || t.includes('guard') || t.includes('gate')) category = 'Security';
  else if (t.includes('noise') || t.includes('loud') || t.includes('music')) category = 'Noise';
  else if (t.includes('clean') || t.includes('garbage') || t.includes('waste')) category = 'Cleanliness';

  return {
    title: text.slice(0, 60),
    description: text,
    category,
    priority: t.includes('urgent') || t.includes('emergency') ? 'Urgent' : 'Medium'
  };
};

module.exports = { chat, summarize, voiceToTicket, bylawQuery, getAILogs };
