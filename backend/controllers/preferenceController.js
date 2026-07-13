import Preference from "../models/Preference.js";

export async function getMyPreferences(req, res) {
  const pref = await Preference.findOneAndUpdate(
    { user: req.user._id },
    { $setOnInsert: { values: {} } },
    { upsert: true, new: true }
  );
  res.json({ preferences: Object.fromEntries(pref.values) });
}

export async function updateMyPreferences(req, res) {
  const { updates } = req.body;
  if (!updates || typeof updates !== "object") {
    return res.status(400).json({ error: "updates object is required." });
  }

  const pref = await Preference.findOneAndUpdate(
    { user: req.user._id },
    { $setOnInsert: { values: {} } },
    { upsert: true, new: true }
  );
  for (const [key, value] of Object.entries(updates)) {
    pref.values.set(key, String(value));
  }
  await pref.save();
  res.json({ preferences: Object.fromEntries(pref.values) });
}
