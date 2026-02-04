# Binance Execution Pro — Paid License Backend Contract (Stripe + JWT)

This file describes the minimal backend you need to support:
- **Free users**: Testnet / paper trading only
- **Paid users**: Mainnet real trading unlocked via **server-issued JWT**

## 1) Identity: installId

The extension generates a stable `installId` on first run and stores it in `chrome.storage.local`.
You use this `installId` to map a Chrome install to a Stripe subscription.

## 2) Stripe Checkout

When the user clicks “Pay Now / Upgrade”, your frontend opens Stripe Checkout.
Pass `installId` into Stripe:
- `client_reference_id = installId` (recommended), OR
- `metadata.installId = installId`

## 3) Stripe Webhooks

On webhook events, update your database:
- `checkout.session.completed`
- `customer.subscription.created|updated|deleted`

Store:
- `installId -> stripeCustomerId -> subscriptionStatus`

## 4) JWT Issuance

Issue short-lived tokens (recommended 15–60 minutes).

### JWT claims (recommended)
- `sub`: installId
- `plan`: "pro"
- `scopes`: ["mainnet", "multi_profile"]
- `iat`, `nbf`, `exp`

Sign using RS256 (recommended) so the extension can optionally verify signature with a public key.

## 5) API Endpoints

### POST /api/license/issue
Request:
```json
{ "installId": "..." }
```

Response (active subscription):
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9....",
  "expiresAt": 1760000000,
  "plan": "pro",
  "scopes": ["mainnet", "multi_profile"]
}
```

Response (not paid):
```json
{ "error": "inactive_subscription" }
```

### GET /api/license/status?installId=...
Response:
```json
{ "active": true, "plan": "pro", "scopes": ["mainnet"] }
```

## 6) Security Notes

- The extension must refuse Mainnet without a valid token.
- Tokens should be short-lived so cancellation takes effect quickly.
- Optionally implement server-side rate limits on /issue to prevent abuse.

