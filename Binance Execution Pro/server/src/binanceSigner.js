const crypto = require('crypto');

function buildQueryString(params) {
  return Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');
}

function hmacSha256Hex(secret, message) {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

function signParams(params, apiSecret) {
  const queryString = buildQueryString(params);
  const signature = hmacSha256Hex(apiSecret, queryString);
  return { queryString, signature };
}

module.exports = {
  buildQueryString,
  signParams
};

