console.log("LoggedInPage loaded");

import { useEffect, useState } from "react";
import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Renders the dashboard for an authenticated user.
 *
 * ─ How it works ─────────────────────────────────────────────────────────────
 * • On mount, it calls GET /api/me (implemented in your API to return
 *   { name, email } when req.session.accessToken exists).
 * • While the request is in‑flight it shows a tiny spinner.
 * • If the API responds 401/403 it means the user is not logged in → we push
 *   them back to the public landing page.
 * • When the user object comes back we greet them by name and hide any
 *   “Login” / “Sign in with Juno” buttons (Parent <App> can check
 *   `isAuthenticated` via context or we can simply not render the buttons here).
 *
 * Tailwind + Shadcn/ui
 * – Soft card with a welcome heading
 * – Motion slide‑in (feels snappy)
 */



export default function LoggedInPage() {

  console.log("LoggedInPage loaded");
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log("LoggedInPage: loading", loading);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        console.log("LoggedInPage: /api/me", res);
        if (res.ok) {
          const data = await res.json();
          setUser(data.user); // Assuming the API returns { user: { ... } }
        } else {
          // not authenticated – kick back to landing page
          window.location.replace("/");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

   const [navOpen, setNavOpen] = useState(false);

  function beginAuth() {
  const state = generateRandomString(16);
  const verifier = generateRandomString(64);
  sessionStorage.setItem('pkce_state', state);
  sessionStorage.setItem('pkce_verifier', verifier);
  generateCodeChallenge(verifier).then(challenge => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    });
    window.location = `${authorizeUrl}?${params.toString()}`;
  });
}

  useEffect(() => {
    if (window.location.pathname.startsWith('/auth/callback')) {
      const url = new URL(window.location);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const stored = sessionStorage.getItem('pkce_state');
      if (state !== stored) {
        alert('Invalid OAuth state; possible CSRF.');
        return;
      }
      // TODO: POST {code, verifier} to your backend to exchange for tokens
      alert('Login successful! Auth code:\n' + code + '\n\nImplement token exchange in backend.');
    }
  }, []);

  const menuItems = [
    { label: 'Marketplace', href: '#' },
    { label: 'Watch Brands', href: '#' },
    { label: 'Sell a Watch', href: '#' },
    { label: 'Magazine', href: '#' },
    { label: 'Watch Collection', href: 'http://localhost:5173/watches' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
      {/* ---------- NAVBAR ---------- */}
      <header className="bg-[#2a2a29] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <a href="#" className="text-2xl font-bold tracking-tight">Luxe24.1 Marketplace</a>

          {/* desktop menu */}
          <nav className="hidden md:flex gap-6 text-sm lg:text-base">
            {menuItems.map(item => (
              <a key={item.label} href={item.href} className="hover:text-[#3ab54a] transition-colors">
                {item.label}
              </a>
            ))}
          </nav>

          {/* actions */}
          <div className="flex items-center gap-4">
            <button
            className="mt-6 inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
            onClick={async () => {
              await fetch("/auth/logout", { method: "POST", credentials: "include" });
              window.location.replace("/");
            }}
          >
            Sign out
          </button>

            {/* mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
              onClick={() => setNavOpen(o => !o)}
            >
              {navOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* mobile menu */}
        {navOpen && (
          <nav className="md:hidden bg-[#2a2a29] border-t border-white/10 px-6 pb-4 space-y-2">
            {menuItems.map(item => (
              <a
                key={item.label}
                href={item.href}
                className="block py-2 text-sm text-white/90 hover:text-[#3ab54a]"
                onClick={() => setNavOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <button
            className="mt-6 inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
            onClick={async () => {
              await fetch("/auth/logout", { method: "POST", credentials: "include" });
              window.location.replace("/");
            }}
          >
            Sign out
          </button>
            <a text="Juno Login here" href="https://auth.juno.local/oidc/authorize
        ?client_id=marketplace-ui
        &response_type=code
        &redirect_uri=https%3A%2F%2Fapp.juno.local%2Fcallback
        &scope=openid%20profile%20email
        &state=af0ifjsldkj
        &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
        &code_challenge_method=S256">  
        <img src="/assets/login-with-juno.svg" alt="Login with Juno" />
</a>
          </nav>
        )}
      </header>

      {/* ---------- HERO ---------- */}
      <main className="flex-1">
        <section className="relative h-[60vh] lg:h-[75vh] flex items-center justify-center text-center isolate overflow-hidden">
          {/* hero background */}
          <img
            src="/luxurywatches.jpg"
            alt="Luxury watches background"
            className="absolute inset-0 -z-10 w-full h-full object-cover"/>
          <div className="absolute inset-0 -z-10 bg-black/40" />

          {/* hero content */}
          <div className="text-white px-6 max-w-3xl">
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6">
              Welcome to Luxe24 Marketplace
            </h1>
            <p className="mb-8 text-lg lg:text-xl text-white/90">
              Buy, sell and manage your watch collection securely through our Juno‑powered marketplace.
            </p>
            
            

          </div>
        </section>
      </main>
{/* ───────────────── Footer ───────────────── */}
<footer className="bg-[#1a2421] text-gray-400 text-sm py-6">
  <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between gap-4">
    <div>&copy; {new Date().getFullYear()} LuxTime Market. All rights reserved.</div>

    <div className="space-x-4">
      <a href="#privacy" className="hover:text-gray-200">
        Privacy Policy
      </a>
      <a href="#terms" className="hover:text-gray-200">
        Terms of Use
      </a>
      <a href="#contact" className="hover:text-gray-200">
        Contact Us
      </a>
    </div>
  </div>
</footer>
</div>
  );
}
