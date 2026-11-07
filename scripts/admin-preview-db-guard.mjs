// Only the Preview of the Admin Key PR may use this staging endpoint.
// Inspect the URL locally. Never log it, query the database, or print parse errors.
const branch = 'feature/vercel-admin-qr-passkeys';
const stagingHost = /^ep-icy-tree-bak4zf4a(?:-pooler)?\.(?:[a-z0-9-]+\.)*neon\.tech$/;
const permittedOptions = new Map([
  ['sslmode', new Set(['require', 'verify-ca', 'verify-full'])],
  ['channel_binding', new Set(['require', 'prefer'])],
]);

function matchesStaging(value) {
  try {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
        !stagingHost.test(url.hostname) || url.hash || (url.port && url.port !== '5432')) return false;
    // pg connection options can override the authority or reroute via a proxy.
    for (const [key, setting] of url.searchParams) {
      if (!permittedOptions.get(key)?.has(setting)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

if (process.env.VERCEL_ENV === 'preview') {
  const ref = process.env.VERCEL_GIT_COMMIT_REF;
  if (!ref) {
    console.error('BLOCK: cannot identify the Preview Git branch.');
    process.exit(1);
  }
  if (ref === branch) {
    if (!matchesStaging(process.env.DATABASE_URL)) {
      console.error('BLOCK: Admin Key Preview requires the skp-auth-staging database endpoint.');
      process.exit(1);
    }
    console.log('PASS: Admin Key Preview targets the expected staging endpoint.');
  }
}
