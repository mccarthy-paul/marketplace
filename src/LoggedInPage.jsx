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
        const res = await fetch("http://localhost:8001/api/me", { credentials: "include" });
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

  // Effect to read id_token from URL and store in local storage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idToken = urlParams.get('id_token');

    if (idToken) {
      localStorage.setItem('id_token', idToken);

      // Remove id_token from URL
      urlParams.delete('id_token');
      window.history.replaceState({}, document.title, `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`);
    }
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
    { label: 'Watch Collection', href: 'http://localhost:5173/watches' },
    { label: 'Bids', href: 'http://localhost:5173/my-watch-bids' } 
    // Added link for user's watch bids
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
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
              Welcome{user ? `, ${user.name}` : ''} to Luxe24 Marketplace
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
