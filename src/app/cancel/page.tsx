'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

export default function CancelPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  //applies theme class to body
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark");
      document.body.classList.remove("light");
    } else {
      document.body.classList.add("light");
      document.body.classList.remove("dark");
    }
  }, [theme]);

  //toggles theme function
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === "dark" ? "light" : "dark");
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 p-4 ${
      theme === "dark" 
                                  ? "bg-gradient-to-br from-neutral-900 to-slate-900"
        : "bg-gradient-to-br from-cyan-50 to-teal-50"
    }`}>
      <div className="absolute top-4 right-4 flex gap-2">
        <button 
          onClick={toggleTheme}
          className={`rounded-full h-8 p-2 flex items-center gap-2 text-xs ${
            theme === "dark"
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
      
      <div className="absolute top-4 left-4">
        <div className="flex items-center gap-1">
          <div className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Next Payment Gateway
          </div>
        </div>
      </div>

      <div className={`w-full max-w-md backdrop-blur-md shadow-xl border-0 rounded-xl overflow-hidden transition-all duration-300 ${
        theme === "dark" 
                     ? "bg-gray-900/80 border-gray-800" 
          : "bg-white/90"
      }`}>
        <div className={`h-1 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300`}></div>
        <div className="pt-10 pb-8 px-8">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className={`rounded-full p-6 ${
              theme === "dark" ? "bg-amber-900/30" : "bg-amber-100"
            }`}>
              <AlertTriangle className={`h-16 w-16 ${
                theme === "dark" ? "text-amber-400" : "text-amber-600"
              }`} />
            </div>

            <h1 className={`text-2xl font-bold text-center mb-6 ${
              theme === "dark" ? "text-white" : "text-stone-800"
            }`}>
              Transaction Cancelled
            </h1>
            
            <p className={`text-center mb-6 ${
              theme === "dark" ? "text-zinc-300" : "text-stone-600"
            }`}>
              Your payment transaction has been cancelled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 