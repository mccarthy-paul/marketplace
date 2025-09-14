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

  // Fetch user data
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

  // Note: beginAuth function removed - not needed on logged in page

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
    { label: 'Watch Collection', href: 'https://a2842d04cca8.ngrok-free.app/watches' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
      {/* ---------- HERO ---------- */}
      <main className="flex-1 flex flex-col">
        <section className="relative flex-1 min-h-[60vh] lg:min-h-[75vh] flex items-center justify-center text-center isolate overflow-hidden">
          {/* hero background */}
          <img
            src="/luxurywatches.jpg"
            alt="Luxury watches background"
            className="absolute inset-0 -z-10 w-full h-full object-cover"/>
          <div className="absolute inset-0 -z-10 bg-black/40" />

          {/* hero content */}
          <div className="text-white px-6 max-w-3xl">
            {/* Welcome message above main heading when logged in */}
            {user && (
              <h2 className="text-2xl lg:text-3xl font-semibold mb-4 text-[#3ab54a]">
                Welcome Back, {user.name}!
              </h2>
            )}
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6">
              Discover & Trade Luxury Watches
            </h1>
            <p className="mb-8 text-lg lg:text-xl text-white/90">
              Buy, sell and manage your watch collection securely through our Juno‑powered marketplace.
            </p>
            
            {/* Navigation button */}
            <div className="flex justify-center">
              <a
                href="/watches"
                className="bg-[#3ab54a] hover:bg-[#32a042] text-white font-semibold py-3 px-8 rounded-xl shadow-xl transition-transform hover:-translate-y-0.5"
              >
                Browse Watches
              </a>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
