# MemeScanner testing checklist

## Checks performed for this package

- JavaScript syntax checks passed for the app, Pages Functions and proxy smoke test.
- Jupiter proxy smoke test passed: endpoint allowlist and server-only API key injection.
- Full Vite production build was not run in this environment because npm package registry access timed out.
- Live API, Phantom signing, real swap execution and Trigger V2 OCO lifecycle have not been end-to-end tested.

## Before deployment

- [ ] Run `npm install` with Node.js 20+.
- [ ] Run `npm run build` and confirm `dist/` is created.
- [ ] Run `node tests/proxy-smoke-test.mjs`.
- [ ] Set `JUPITER_API_KEY` as a Cloudflare Pages secret.
- [ ] Run `npx wrangler pages dev dist` with `.dev.vars` and check token lookup.
- [ ] Search a liquid, well-known Solana token and verify the returned mint exactly matches the pasted CA.
- [ ] Confirm chart candles, timeframe changes, price axis and no-pool error states.
- [ ] Test on Android inside Phantom's in-app browser and on desktop.
- [ ] Confirm the wallet address shown after connection is the expected wallet.
- [ ] Verify Buy quote input/output values and wallet signing prompt before sending.
- [ ] Verify Sell percentage calculations and remaining token amount.
- [ ] Check token decimal handling for 6- and 9-decimal tokens.
- [ ] Confirm failed swaps do not create/update positions as if successful.

## Trigger V2: required before relying on stop-loss / take-profit

The code contains an OCO workflow, but it is not verified end-to-end. Do not rely on it as protection until all of these are proven with a dedicated wallet and a tiny position:

- [ ] Verify current Trigger V2 challenge, verify, refresh and bearer-token response fields.
- [ ] Verify vault retrieval and registration behavior.
- [ ] Verify current `deposit/craft` request schema (Jupiter's May 2026 changelog says craft-deposit requires order metadata).
- [ ] Verify deposit transaction signing and confirmation.
- [ ] Verify current OCO order request schema, USD trigger price units and expiry format.
- [ ] Confirm both TP and SL legs are visible as active on Jupiter.
- [ ] Confirm one leg filling cancels the other.
- [ ] Confirm cancellation returns the remaining tokens to the wallet and position accounting is correct.
- [ ] Test partial fills, expired orders, failed deposits, rejected orders and refresh-token rotation.

Do not deposit valuable tokens into an order vault until the full lifecycle has passed these checks.
