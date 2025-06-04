# Juno Marketplace – Sample “Login with Juno” App

Quickly demonstrates how to add “Login with Juno” (OAuth 2.1 + PKCE) to a React 18 + Vite application.

## Prerequisites

* Node 18+ (install via Homebrew: `brew install node@18`)
* pnpm (`npm install -g pnpm`) – or translate commands to npm/yarn
* Juno developer account + Client ID

## Setup

```bash
pnpm install
cp .env.example .env.local      # fill in your client ID + redirect URI
pnpm dev
```

Open <http://localhost:5173> and click **Login with Juno**.

> After Juno redirects back, the app simply alerts the `code`.  
> Exchange the code for tokens in your own backend service per Juno docs.

## Production Build

```bash
pnpm build      # bundles to /dist
pnpm preview    # test production build locally
```

## Security Notes

* PKCE `code_verifier` stored in `sessionStorage`, cleared after use.
* OAuth `state` checked to mitigate CSRF.
* Tokens **must not** be stored in browser localStorage/sessionStorage—keep them server‑side and issue an HTTP‑only cookie or JWT short‑lived session instead.
