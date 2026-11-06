# jsQR 1.4.0

Unmodified `dist/jsQR.js` from https://github.com/cozmo/jsQR at commit
`8e6a036beafa7053dd44b1b76ac578d22b1b3311`, renamed `.cjs` so Vinext delegates CommonJS handling to the bundler. The decoding algorithm is unchanged.
Apache-2.0 license accompanies it. The minimal local declaration describes only
our used API. No CDN or camera-frame upload. Lazy-loaded only by Admin Key.

Original upstream dist SHA-256: `3325b0888fa4745c4e6940897d8c4f426fbaae76901fcbfe1871a04e90a51655`.

Vendored because the development environment could not reach the npm registry.
Update only from the upstream source, preserve the license, and run QR pixel tests.
