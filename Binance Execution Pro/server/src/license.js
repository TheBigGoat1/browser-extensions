const jwt = require('jsonwebtoken');

function verifyLicenseToken(token, { publicKey, issuer, audience } = {}) {
  if (!token) throw new Error('missing_license_token');
  if (!publicKey) throw new Error('license_public_key_not_configured');

  const payload = jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer,
    audience
  });

  const scopes = Array.isArray(payload.scopes) ? payload.scopes : [];
  return { payload, scopes };
}

function requireScope(scopes, requiredScope) {
  if (!scopes.includes(requiredScope)) {
    const err = new Error('insufficient_scope');
    err.code = 'insufficient_scope';
    throw err;
  }
}

module.exports = {
  verifyLicenseToken,
  requireScope
};

