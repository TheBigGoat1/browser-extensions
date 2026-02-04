// In-memory store for dev.
// Production: replace with DB/Redis + encryption-at-rest.

const sessions = new Map(); // installId -> { apiKey, apiSecret, environment, updatedAt }

function setSession(installId, session) {
  sessions.set(installId, { ...session, updatedAt: Date.now() });
}

function getSession(installId) {
  return sessions.get(installId) || null;
}

function clearSession(installId) {
  sessions.delete(installId);
}

module.exports = {
  setSession,
  getSession,
  clearSession
};

