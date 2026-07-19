// Guards the /internal/* routes, which only the Flask AI service should
// ever call. Never exposed to the frontend/browser.
export function requireInternalSecret(req, res, next) {
  const secret = req.headers["x-internal-secret"];
  if (!process.env.INTERNAL_SERVICE_SECRET || secret !== process.env.INTERNAL_SERVICE_SECRET) {
    return res.status(401).json({ error: "Unauthorized internal request." });
  }
  next();
}
