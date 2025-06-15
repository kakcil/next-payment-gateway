'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleTestPayment = (type: string) => {
    //creates test transaction id
    const testId = `test_${type}_${Date.now()}`;
    
    //redirects to existing transaction page
    router.push(`/transaction/${testId}`);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${theme === "dark"
        ? "bg-gradient-to-br from-neutral-900 to-slate-900"
        : "bg-gradient-to-br from-cyan-50 to-teal-50"
      }`}>
      <div className="text-center max-w-4xl mx-auto p-8">
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleTheme}
            className={`rounded-full h-8 p-2 flex items-center gap-2 text-xs ${theme === "dark"
                ? "bg-gray-800/30 text-white border border-gray-700"
                : "bg-white text-stone-700 border border-stone-300 shadow-sm"
              }`}
          >
            {theme === "dark" ? (
              <>
                <span className="text-xs">Light Mode</span>
                <span>☀️</span>
              </>
            ) : (
              <>
                <span className="text-xs">Dark Mode</span>
                <span>🌙</span>
              </>
            )}
          </button>
        </div>
        <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent mb-4">
          Next Payment Gateway
        </div>
        <div className={`text-lg mb-8 ${theme === "dark" ? "text-stone-400" : "text-stone-600"}`}>
          Payment Gateway Test Platform
        </div>
        
        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
          <button
            onClick={() => handleTestPayment('crypto')}
            className={`backdrop-blur-sm rounded-xl p-6 transition-all duration-300 group ${theme === "dark"
                ? "bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800/70"
                : "bg-white/70 border border-gray-200 hover:bg-white shadow-lg hover:shadow-xl"
              }`}
          >
            <div className={`text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 ${theme === "dark" ? "text-white" : "text-orange-500"}`}>
              ₿
            </div>
            <div className="text-xl font-semibold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent mb-2">
              Cryptocurrency
            </div>
            <div className={`text-sm mb-4 ${theme === "dark" ? "text-stone-400" : "text-stone-600"}`}>
              Bitcoin, Ethereum and other cryptocurrencies
            </div>
            <div className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium group-hover:from-cyan-400 group-hover:to-teal-400 transition-all duration-300">
              Test Now
            </div>
          </button>

          <button
            onClick={() => handleTestPayment('bank')}
            className={`backdrop-blur-sm rounded-xl p-6 transition-all duration-300 group ${theme === "dark"
                ? "bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800/70"
                : "bg-white/70 border border-gray-200 hover:bg-white shadow-lg hover:shadow-xl"
              }`}
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
              🏦
            </div>
            <div className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Bank Transfer
            </div>
            <div className={`text-sm mb-4 ${theme === "dark" ? "text-stone-400" : "text-stone-600"}`}>
              Secure bank wire transfer payment
            </div>
            <div className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium group-hover:from-cyan-400 group-hover:to-teal-400 transition-all duration-300">
              Test Now
            </div>
          </button>
        </div>

        <div className={`text-sm ${theme === "dark" ? "text-stone-500" : "text-stone-600"}`}>
          This is a test platform. No real money transactions are processed.
        </div>
      </div>
    </div>
  );
}
