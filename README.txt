MemeScanner Stage 4 — Live FOMO Integration

This package adds a Cloudflare Worker endpoint:
  /api/traders?window=24h
  /api/traders?window=7d
  /api/traders?window=30d

The Worker proxies the public FOMO API leaderboard endpoint and keeps the browser talking only to MemeScanner.

FOMO API documentation:
https://fomoapi.io/blog/fomo-leaderboard-api-rank-memecoin-traders

Deployment:
- This is a Worker package, not a static-only upload.
- Deploy worker.js as the Worker script.
- Keep the existing memescanner.fun domain unchanged until the new Worker is tested.
- pump.fun remains intentionally unconnected in this package; it will be added separately once its data source/authentication is confirmed.

No API key is embedded in this package.
