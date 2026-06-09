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

// POST /api/ai/chat - Enhanced FAQ + context chatbot with better fallbacks
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
  } catch (error) {
    console.error('AI Chat Error:', error);
    let fallback = 'I\'m here to help! Please contact the admin or try again shortly.';
    try {
      fallback = await getEnhancedFallbackResponse(message, societyId);
    } catch (fallbackError) {
      console.error('AI Chat Fallback Error:', fallbackError);
      fallback = getFallbackResponse(message);
    }
    res.json({ success: true, reply: fallback, fallback: true });
  }
};

// POST /api/ai/summarize - Detailed AI-generated insights for society management
const summarize = async (req, res) => {
  const { societyId } = req.body;
  const start = Date.now();
  try {
    const complaints = await Complaint.find({ society: societyId }).select('title category status createdAt priority');
    const totalComplaints = complaints.length;
    
    if (!totalComplaints) {
      return res.json({ 
        success: true, 
        summary: 'No complaints found in the system.',
        insights: {
          totalComplaints: 0,
          resolvedRate: 0,
          categoryBreakdown: {},
          priorityDistribution: {},
          trends: 'No data available',
          recommendations: ['Encourage residents to report issues promptly', 'Regular maintenance checks can prevent complaints']
        }
      });
    }

    // Category breakdown
    const categoryCounts = complaints.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {});
    
    // Status breakdown
    const statusCounts = complaints.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});
    
    // Priority breakdown
    const priorityCounts = complaints.reduce((acc, c) => {
      acc[c.priority] = (acc[c.priority] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate resolution rate
    const resolvedCount = statusCounts['Resolved'] || 0;
    const resolvedRate = totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 0;
    
    // Recent complaints (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentComplaints = complaints.filter(c => c.createdAt > thirtyDaysAgo).length;
    
    // Generate detailed prompt for AI analysis
    const complaintText = complaints.map(c => `[${c.category}] ${c.title} - Status: ${c.status} - Priority: ${c.priority} - Date: ${c.createdAt.toDateString()}`).join('\n');
    
    const detailedPrompt = `Analyze these society complaints and provide detailed insights for management:

COMPLAINT DATA:
${complaintText}

STATISTICS:
- Total Complaints: ${totalComplaints}
- Resolved: ${resolvedCount} (${resolvedRate}%)
- Recent (30 days): ${recentComplaints}
- Top Categories: ${Object.entries(categoryCounts).sort((a,b) => b[1]-a[1]).slice(0,3).map(([cat, count]) => `${cat}(${count})`).join(', ')}

Please provide a comprehensive analysis including:
1. Key patterns and trends
2. Most problematic areas
3. Resolution effectiveness
4. Potential root causes
5. Specific recommendations for improvement
6. Priority areas for maintenance
7. Communication suggestions for residents

Structure the response as a detailed report with clear sections.`;

    const { content: detailedAnalysis, tokens } = await groqChat([{ role: 'user', content: detailedPrompt }], 800);
    
    // Extract key insights
    const insights = {
      totalComplaints,
      resolvedRate,
      categoryBreakdown: categoryCounts,
      priorityDistribution: priorityCounts,
      statusBreakdown: statusCounts,
      recentComplaints,
      topCategories: Object.entries(categoryCounts).sort((a,b) => b[1]-a[1]).slice(0,5),
      trends: recentComplaints > totalComplaints * 0.3 ? 'Increasing complaint volume' : 'Stable complaint levels',
      recommendations: [
        resolvedRate < 50 ? 'Improve complaint resolution time' : 'Maintain current resolution standards',
        Object.keys(categoryCounts).length > 5 ? 'Focus on preventive maintenance' : 'Address recurring issues',
        recentComplaints > 10 ? 'Increase maintenance staff' : 'Monitor complaint trends'
      ]
    };

    await logAI(req.user._id, societyId, 'summarize', complaintText, detailedAnalysis, tokens, Date.now() - start);
    
    res.json({ 
      success: true, 
      summary: detailedAnalysis,
      insights 
    });
  } catch (error) {
    console.error('AI Summarize Error:', error);
    // Enhanced fallback analysis with detailed insights
    const complaints = await Complaint.find({ society: societyId });
    const categoryCounts = complaints.reduce((acc, c) => { acc[c.category] = (acc[c.category] || 0) + 1; return acc; }, {});
    const statusCounts = complaints.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});
    const priorityCounts = complaints.reduce((acc, c) => { acc[c.priority] = (acc[c.priority] || 0) + 1; return acc; }, {});
    
    const resolvedCount = statusCounts['Resolved'] || 0;
    const resolvedRate = complaints.length > 0 ? Math.round((resolvedCount / complaints.length) * 100) : 0;
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentComplaints = complaints.filter(c => c.createdAt > thirtyDaysAgo).length;
    
    const topCategories = Object.entries(categoryCounts).sort((a,b) => b[1]-a[1]);
    const urgentCount = priorityCounts['Urgent'] || 0;
    const highCount = priorityCounts['High'] || 0;
    
    const insights = {
      totalComplaints: complaints.length,
      resolvedRate,
      categoryBreakdown: categoryCounts,
      priorityDistribution: priorityCounts,
      statusBreakdown: statusCounts,
      recentComplaints,
      topCategories: topCategories.slice(0,5),
      trends: recentComplaints > complaints.length * 0.3 ? 'Increasing complaint volume - requires attention' : 
              recentComplaints < complaints.length * 0.1 ? 'Low recent activity - good maintenance' : 'Stable complaint levels',
      recommendations: [
        resolvedRate < 70 ? 'Improve complaint resolution processes and response times' : 'Continue maintaining high resolution standards',
        urgentCount > complaints.length * 0.2 ? 'Address urgent issues immediately to prevent escalation' : 'Monitor priority distribution',
        topCategories.length > 0 ? `Focus preventive maintenance on: ${topCategories[0][0]}` : 'Diversify maintenance efforts',
        recentComplaints > 15 ? 'Consider increasing maintenance staff or contractors' : 'Maintain current staffing levels',
        'Implement regular facility inspections to catch issues early',
        'Enhance resident communication about maintenance schedules',
        'Create a digital complaint tracking system for better visibility'
      ]
    };
    
    const summary = `**📊 Society Complaint Analysis Report**

**📈 Overview:**
- **Total Complaints:** ${complaints.length}
- **Resolution Rate:** ${resolvedRate}% (${resolvedCount} resolved)
- **Recent Activity:** ${recentComplaints} complaints in last 30 days
- **Most Critical Issues:** ${urgentCount + highCount} high-priority complaints

**🎯 Key Patterns & Trends:**
- **Primary Complaint Categories:** ${topCategories.slice(0,3).map(([cat, count]) => `${cat} (${count})`).join(', ')}
- **Resolution Performance:** ${resolvedRate >= 80 ? 'Excellent' : resolvedRate >= 60 ? 'Good' : resolvedRate >= 40 ? 'Needs improvement' : 'Critical attention required'}
- **Activity Trend:** ${insights.trends}
- **Priority Distribution:** ${urgentCount} urgent, ${highCount} high, ${priorityCounts['Medium'] || 0} medium priority

**🔍 Most Problematic Areas:**
${topCategories.slice(0,3).map(([category, count], i) => `${i+1}. **${category}** - ${count} complaints (${Math.round(count/complaints.length*100)}% of total)`).join('\n')}

**💡 Detailed Recommendations:**
${insights.recommendations.map(rec => `• ${rec}`).join('\n')}

**📋 Action Items:**
1. **Immediate (This Week):** Address all urgent and high-priority complaints
2. **Short-term (1-2 Weeks):** Schedule preventive maintenance for top complaint categories
3. **Medium-term (1 Month):** Review and optimize complaint resolution workflows
4. **Long-term (3 Months):** Implement resident feedback system and regular facility audits

**📞 Communication Suggestions:**
- Send monthly maintenance updates to residents
- Create emergency contact protocols for urgent issues
- Implement complaint status notifications via app
- Host quarterly resident meetings to discuss common concerns

*Note: This analysis is generated using comprehensive complaint data patterns and best practices for society management.*`;

    res.json({ 
      success: true, 
      summary,
      insights,
      fallback: true 
    });
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
    if (!society?.rules) return res.json({ success: true, answer: 'No bylaws uploaded yet. Please ask your admin to add society rules from the Society Settings page.' });

    let contextText = society.rules;
    if (society.bylawChunks?.length) {
      try {
        const relevantChunk = await findRelevantChunk(question, society.bylawChunks);
        if (relevantChunk) contextText = relevantChunk;
      } catch (e) {
        console.warn('[Bylaw] Vector search failed, using full rules:', e.message);
      }
    }

    const prompt = `Society Bylaws (relevant section):\n${contextText}\n\nQuestion: ${question}\nAnswer based only on the bylaws above:`;
    const { content: answer, tokens } = await groqChat([{ role: 'user', content: prompt }], 300);
    await logAI(req.user._id, societyId, 'bylaw', question, answer, tokens, Date.now() - start);
    res.json({ success: true, answer });
  } catch (error) {
    console.error('[Bylaw] Error:', error.message);
    // Fallback: search rules text directly without AI
    try {
      const society = await Society.findById(societyId);
      if (society?.rules) {
        const rules = society.rules;
        const q = question.toLowerCase();
        const lines = rules.split('\n').filter(l => l.trim());
        const matched = lines.filter(l => q.split(' ').some(w => w.length > 3 && l.toLowerCase().includes(w)));
        const answer = matched.length
          ? `Based on society bylaws:\n${matched.slice(0, 5).join('\n')}`
          : `Here are the society rules:\n${rules.slice(0, 500)}${rules.length > 500 ? '...' : ''}`;
        return res.json({ success: true, answer, fallback: true });
      }
    } catch { /* ignore */ }
    res.json({ success: true, answer: 'AI service is temporarily unavailable. Please contact your society admin for bylaw queries.', fallback: true });
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

const getEnhancedFallbackResponse = async (message, societyId) => {
  try {
    const society = await Society.findById(societyId);
    const msg = message.toLowerCase();
    
    // Society-specific responses
    if (msg.includes('name') || msg.includes('society')) {
      return `This is ${society?.name || 'our society'}. We're located at ${society?.address || 'the society premises'} in ${society?.city || 'the city'}.`;
    }
    
    if (msg.includes('amenities') || msg.includes('facilities')) {
      const amenities = society?.amenities?.join(', ') || 'gym, swimming pool, and parking facilities';
      return `Our society offers: ${amenities}. For more details, please check the Society section in your dashboard.`;
    }
    
    if (msg.includes('maintenance') || msg.includes('fee') || msg.includes('dues')) {
      const amount = society?.maintenanceAmount || 2000;
      return `Monthly maintenance fee is ₹${amount}. It's due by the 10th of each month. You can check your payment status in the Payments section.`;
    }
    
    if (msg.includes('rules') || msg.includes('bylaws') || msg.includes('regulations')) {
      const rules = society?.rules || 'Standard society rules apply: No loud music after 10 PM, pets allowed with registration, maintain cleanliness, respect neighbors.';
      return `Society rules: ${rules.substring(0, 200)}${rules.length > 200 ? '...' : ''}`;
    }
    
    // General responses
    if (msg.includes('gym') || msg.includes('timing') || msg.includes('hours')) {
      return 'Gym is open from 6 AM to 10 PM daily. Please maintain equipment and clean up after use.';
    }
    
    if (msg.includes('parking')) {
      return 'Each flat gets one dedicated parking spot. Visitor parking is available near the main gate. Please park responsibly.';
    }
    
    if (msg.includes('pool') || msg.includes('swimming')) {
      return 'Swimming pool is open from 7 AM to 8 PM. Children under 12 must be accompanied by adults. Please shower before entering.';
    }
    
    if (msg.includes('security') || msg.includes('guard')) {
      return 'Security guards are available 24/7 at the main gate. Please inform them about any visitors or deliveries.';
    }
    
    if (msg.includes('complaint') || msg.includes('issue') || msg.includes('problem')) {
      return 'You can raise a complaint through the Complaints section in your dashboard. Our maintenance team will address it promptly.';
    }
    
    if (msg.includes('payment') || msg.includes('pay') || msg.includes('bill')) {
      return 'You can view and pay your maintenance bills in the Payments section. We accept online payments for your convenience.';
    }
    
    if (msg.includes('admin') || msg.includes('contact') || msg.includes('help')) {
      return 'For urgent matters or specific queries, please contact the society admin through the app or visit the management office.';
    }
    
    if (msg.includes('notice') || msg.includes('announcement')) {
      return 'Check the Notifications section for all society announcements, meeting schedules, and important updates.';
    }
    
    // Default helpful response
    return `I'm here to help with information about ${society?.name || 'our society'}! I can assist with amenities, maintenance fees, rules, parking, gym hours, and more. What specific information are you looking for?`;
    
  } catch (error) {
    // If society lookup fails, use basic fallback
    return getFallbackResponse(message);
  }
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
