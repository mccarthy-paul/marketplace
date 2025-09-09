import React from 'react';

export default function HomePage() {
  console.log("HomePage rendering...");

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
              Discover & Trade Luxury Watches
            </h1>
            <p className="mb-8 text-lg lg:text-xl text-white/90">
              Buy, sell and manage your watch collection securely through our Juno‑powered marketplace.
            </p>

            <a 
              href="/auth/junopay/login" 
              className="bg-[#3ab54a] hover:bg-[#32a042] text-white font-semibold py-3 px-8 rounded-xl shadow-xl transition-transform hover:-translate-y-0.5"
            >
              Login with JunoPay
            </a>
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