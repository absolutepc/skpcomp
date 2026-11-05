# SKP Admin: QR + Passkeys — implementation plan

Status: **development branch only**. No QR sign-in is enabled on production.

## Deployment origin
- Production origin: `https://skpcomp.vercel.app`
- WebAuthn RP ID: `skpcomp.vercel.app`
- Never derive the allowed origin or RP ID from an untrusted request Host header.
- Passkeys registered for this RP ID are not automatically valid on a future custom domain.

## Existing authentication
- `lib/admin-session.ts` authenticates the owner with `ADMIN_PASSWORD`, issues an HttpOnly SameSite=Strict cookie, and persists a hashed session token in D1.
- `app/api/store/route.ts` implements login/logout/check and protects catalog mutations.
- `app/shop.tsx` renders the `/admin` login.
- Existing password login must remain functional until a complete, tested alternative is deployed.

## Required stages
1. **Infrastructure verification:** verify Vercel runtime can access the same persistent D1 database and Cloudflare Worker bindings as the current order/admin endpoints. Do not ship auth code that assumes D1 exists on Vercel.
2. **WebAuthn enrollment:** require an existing admin session and recent password re-authentication. Generate a short-lived random registration challenge server-side; verify origin, RP ID, challenge, user presence and user verification, attestation/authenticator data, and public-key format. Persist credential ID, public key, counter, transports, creation date, and revoked state in the database. Never store private keys or biometrics.
3. **QR request:** create a cryptographically random, single-use 60-second challenge, store only a hash server-side, rate-limit requests, and display a URL containing only the temporary challenge (never a session token).
4. **Phone approval:** require a valid WebAuthn assertion from an enrolled credential with user verification. Display requesting browser/device information and require explicit approval. Bind assertion challenge to the specific QR login request and server-side state. Reject replay, expiry, revoked credentials, and cross-origin attempts.
5. **Desktop completion:** atomically consume the approved QR request and issue the same type of server-side session as password login. Use short polling or server push with strict no-store caching. Prevent double redemption and session fixation.
6. **Recovery:** retain password login; implement credential revocation, active session termination, audit logging, and sensible rate limits.
7. **Tests:** challenge replay, wrong origin/RP ID, expired QR, forged approval, concurrent consumption, unauthorized enrollment, CSRF, cross-browser session issuance, revoked credentials, and local/production environments.

## Important security notes
- Passkeys synchronized via iCloud Keychain prove possession of the registered credential, **not necessarily one unique physical iPhone**. The UI should say “registered passkey”, not “verified physical phone”.
- Do not trust a scanned QR code as authorization; it is only a request identifier.
- QR phishing remains possible: show a recognizable browser/device request and require a deliberate confirmation on the phone.
- Enrollment, approval and session issuance must be implemented together; a partial QR endpoint must not be enabled as an alternative login.
- Use a maintained, audited WebAuthn server verifier (for example `@simplewebauthn/server`) with compatible dependencies and lockfile; do not hand-roll CBOR, COSE, signature, and authenticator-data verification.
- Do not alter the SKP storefront appearance while developing authentication.
