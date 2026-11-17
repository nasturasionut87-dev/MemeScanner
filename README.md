# MemeScanner — Solana token trading terminal

A mobile-first Solana trading interface for **memescanner.fun**.

## What is included

- Clean homepage with MemeScanner branding, contract-address search and wallet connect.
- Phantom-only wallet connection (wallet signs locally; the site never asks for seed phrases or private keys).
- Token metadata, price, market cap, liquidity and available Jupiter audit flags.
- Candlestick chart with 1m, 5m, 15m, 1h, 4h and 1d intervals, powered by GeckoTerminal pool OHLCV data. Chart data is cached/delayed by the public provider and is not guaranteed to be tick-by-tick realtime.
- Buy and sell using Jupiter Swap API V2 `/order` + `/execute`.
- Local position tracking for buys made in this browser. It is not a full wallet portfolio index.
- Stop-loss / take-profit OCO workflow using Jupiter Trigger V2. Before enabling real-money use, follow the explicit small-wallet integration test checklist in `TESTING.md`; the Trigger API flow has not been end-to-end tested in this package.
- Server-side Pages Functions proxy keeps the Jupiter server API key out of browser code.

## Important before real trading

This is an un-audited early release. A successful build or quote is not proof of safe execution. Test with a dedicated wallet and a very small amount first. Token metadata and risk flags are incomplete; no audit flag is a safety guarantee. Slippage, liquidity, price impact, failed transactions and total loss are possible.

**Stop-loss / take-profit custody:** the current OCO workflow deposits the selected token amount into a Jupiter-managed vault. The user must explicitly approve that deposit in Phantom. Tokens remain in that vault until an order fills or the user cancels and withdraws them. A trigger price is not a guaranteed execution price. The OCO integration is included but has not been verified end-to-end in this release; do not rely on it to protect funds until tested against the current Jupiter Trigger V2 API with a small test position.

The Holders and Feed tabs are placeholders in this first release; the About tab shows token details. The app does not yet provide wallet-wide holdings or live community feed data.

## Requirements

- Node.js 20 or newer
- A GitHub repository
- Cloudflare Pages
- A Jupiter Developer Platform API key (free tier available): https://developers.jup.ag/portal
- Phantom wallet for trading

## Run locally

```bash
npm install
cp .dev.vars.example .dev.vars
# Add your Jupiter key to .dev.vars as JUPITER_API_KEY=...
npm run dev
```

For a production-like local test of Pages Functions:

```bash
npm run build
npx wrangler pages dev dist
```

## Deploy to GitHub + Cloudflare Pages

1. Create a new **empty** GitHub repository named `memescanner` (or your preferred name).
2. Upload the contents of this ZIP to the repository root. Do not upload the ZIP file itself.
3. In Cloudflare Dashboard, open **Workers & Pages → Create → Pages → Connect to Git** and select the repository.
4. Set the framework preset to **Vite** (or use the custom settings below).
5. Set build command to `npm run build` and output directory to `dist`.
6. Add `JUPITER_API_KEY` as a **secret** in Pages → Settings → Variables and Secrets for Production (and Preview if needed). Never commit the key to GitHub or put it in browser code.
7. Deploy. Cloudflare Pages Functions in `functions/` are deployed automatically with the site.
8. In the Pages project, open **Custom domains**, add `memescanner.fun`, and follow Cloudflare's DNS instructions. Add `www.memescanner.fun` too only if you want the www hostname.
9. Test the deployed site on desktop and inside Phantom's in-app browser before using real funds.

Cloudflare Pages settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

## API services

- Jupiter Tokens API V2 and Price API V3: token lookup and price data.
- Jupiter Swap API V2: quotes and signed swap execution.
- Jupiter Trigger V2: optional OCO stop-loss / take-profit workflow (requires end-to-end validation).
- GeckoTerminal Public API V2: Solana pool selection and OHLCV candles. Public API responses are cached and rate-limited by GeckoTerminal.

## Project layout

- `src/main.js` — wallet, token search, chart rendering, swaps, local positions and Trigger V2 workflow.
- `src/styles.css` — responsive dark UI.
- `functions/api/jupiter/[[path]].js` — allowlisted Jupiter API proxy with server-only key.
- `functions/api/chart.js` — GeckoTerminal pool and OHLCV proxy.
- `TESTING.md` — checks required before real-money use.
