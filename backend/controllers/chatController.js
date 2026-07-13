import ChatMessage from "../models/ChatMessage.js";
import { askAgent } from "../services/aiService.js";

const HISTORY_WINDOW = 12; // last N messages sent to the agent as short-term memory

export async function sendMessage(req, res) {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "message is required." });
    }

    const recent = await ChatMessage.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(HISTORY_WINDOW)
      .lean();
    const history = recent.reverse().map((m) => ({ role: m.role, content: m.content }));

    await ChatMessage.create({ user: req.user._id, role: "user", content: message });

    const agentResult = await askAgent({ userId: req.user._id, message, history });

    const assistantMsg = await ChatMessage.create({
      user: req.user._id,
      role: "assistant",
      content: agentResult.reply,
      trace: agentResult.trace || [],
    });

    res.json({
      reply: agentResult.reply,
      trace: agentResult.trace || [],
      blocked: Boolean(agentResult.blocked),
      messageId: assistantMsg._id,
    });
  } catch (error) {
    const detail = error.response?.data || error.message;
    console.log(detail);
    res.status(502).json({ error: "The AI service could not process this message.", detail });
  }
}

export async function getHistory(req, res) {
  const messages = await ChatMessage.find({ user: req.user._id }).sort({ createdAt: 1 }).lean();
  res.json({ messages });
}

export async function clearHistory(req, res) {
  await ChatMessage.deleteMany({ user: req.user._id });
  res.json({ success: true });
}
