// src/components/Footer.jsx
import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#1a2421] text-gray-400 text-sm py-6">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between gap-4">
        <div>&copy; {new Date().getFullYear()} Luxe24.1 Marketplace. All rights reserved.</div>

        <div className="space-x-4">
          <a href="#privacy" className="hover:text-gray-200">Privacy Policy</a>
          <a href="#terms"   className="hover:text-gray-200">Terms of Use</a>
          <a href="#contact" className="hover:text-gray-200">Contact Us</a>
        </div>
      </div>
    </footer>
  );
}
