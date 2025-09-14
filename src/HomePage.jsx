import React, { useEffect, useState } from 'react';

export default function HomePage() {
  console.log("HomePage rendering...");
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
        setAuthChecked(true);
      } catch (err) {
        console.error('Error fetching current user:', err);
        setAuthChecked(true);
      }
    };

    fetchCurrentUser();
  }, []);

  return (
    <div className="flex flex-col bg-gray-100 font-sans">
      {/* ---------- HERO ---------- */}
      <main className="flex flex-col">
        <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center text-center isolate overflow-hidden">
          {/* hero background */}
          <img
            src="/luxurywatches.jpg"
            alt="Luxury watches background"
            className="absolute inset-0 -z-10 w-full h-full object-cover"/>
          <div className="absolute inset-0 -z-10 bg-black/40" />

          {/* hero content */}
          <div className="text-white px-6 max-w-3xl">
            {/* Welcome message above main heading when logged in */}
            {authChecked && currentUser && (
              <h2 className="text-2xl lg:text-3xl font-semibold mb-4 text-[#3ab54a]">
                Welcome Back, {currentUser.name}!
              </h2>
            )}
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6">
              Discover & Trade Luxury Watches
            </h1>
            <p className="mb-8 text-lg lg:text-xl text-white/90">
              Buy, sell and manage your watch collection securely through our Juno‑powered marketplace.
            </p>

            {!currentUser ? (
              <a 
                href="/auth/junopay/login" 
                className="inline-block bg-[#3ab54a] hover:bg-[#32a042] text-white font-semibold py-3 px-8 rounded-xl shadow-xl transition-transform hover:-translate-y-0.5"
              >
                Login with JunoPay
              </a>
            ) : (
              <a 
                href="/watches" 
                className="inline-block bg-[#3ab54a] hover:bg-[#32a042] text-white font-semibold py-3 px-8 rounded-xl shadow-xl transition-transform hover:-translate-y-0.5"
              >
                Browse Watches
              </a>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}