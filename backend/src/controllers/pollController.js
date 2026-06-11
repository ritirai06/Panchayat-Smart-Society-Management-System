const Poll = require('../models/Poll');
const Notification = require('../models/Notification');

const getPolls = async (req, res) => {
  try {
    const { societyId } = req.params;
    const filter = { society: societyId };
    if (req.query.active === 'true') { filter.isActive = true; filter.endsAt = { $gt: new Date() }; }
    const polls = await Poll.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    // Attach vote counts and user's vote
    const userId = req.user._id;
    const enriched = polls.map(p => {
      const obj = p.toObject();
      obj.totalVotes = obj.options.reduce((sum, o) => sum + o.votes.length, 0);
      obj.myVote = obj.options.findIndex(o => o.votes.some(v => String(v) === String(userId)));
      if (p.isAnonymous) obj.options = obj.options.map(o => ({ ...o, votes: [] })); // hide voters
      return obj;
    });
    res.json({ success: true, polls: enriched });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const createPoll = async (req, res) => {
  try {
    const societyId = req.user.society?._id || req.user.society;
    const { title, description, category, options, endsAt, isAnonymous } = req.body;
    const poll = await Poll.create({
      society: societyId,
      createdBy: req.user._id,
      title, description, category, isAnonymous,
      options: options.map(text => ({ text, votes: [] })),
      endsAt: new Date(endsAt),
    });
    // Broadcast to society
    const io = req.app.get('io');
    io?.to(String(societyId)).emit('new_poll', { title: poll.title });
    await Notification.create({
      title: 'New Poll',
      message: `A new poll has been created: "${title}". Cast your vote now!`,
      type: 'announcement',
      society: societyId,
    });
    res.status(201).json({ success: true, poll });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const vote = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const userId = req.user._id;
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
    if (!poll.isActive || new Date() > poll.endsAt) return res.status(400).json({ success: false, message: 'Poll has ended' });

    // Remove existing vote
    poll.options.forEach(o => { o.votes = o.votes.filter(v => String(v) !== String(userId)); });

    // Add new vote
    if (optionIndex < 0 || optionIndex >= poll.options.length)
      return res.status(400).json({ success: false, message: 'Invalid option' });
    poll.options[optionIndex].votes.push(userId);

    await poll.save();

    // Broadcast live results
    const io = req.app.get('io');
    const results = poll.options.map(o => ({ text: o.text, count: o.votes.length }));
    io?.to(String(poll.society)).emit('poll_update', { pollId: poll._id, results });

    res.json({ success: true, message: 'Vote cast!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const closePoll = async (req, res) => {
  try {
    const poll = await Poll.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
    res.json({ success: true, poll });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const deletePoll = async (req, res) => {
  try {
    await Poll.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Poll deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getPolls, createPoll, vote, closePoll, deletePoll };
