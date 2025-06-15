'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ExternalLink } from 'lucide-react';

export default function ThankYouPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);
  
  //checks for redirect URL after payment and sets countdown
  useEffect(() => {
    try {
      //processes redirectUrlAfterPayment if exists
      const url = localStorage.getItem('redirectUrlAfterPayment');
      if (url) {
        setRedirectUrl(url);
        
        //sets countdown for auto-redirect
        let secondsLeft = 10;
        setCountdown(secondsLeft);
        
        //updates countdown every second
        const countdownInterval = setInterval(() => {
          secondsLeft -= 1;
          setCountdown(secondsLeft);
          
          if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            //clears localStorage and redirects to merchant URL
            localStorage.removeItem('redirectUrlAfterPayment');
            console.log('Auto-redirecting to merchant URL after 10s:', url);
            window.location.href = url;
          }
        }, 1000);
        
        //cleanup interval on unmount
        return () => clearInterval(countdownInterval);
      }
    } catch (err) {
      console.error('Error processing redirect URL:', err);
    }
  }, []);

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

  //handles immediate redirect
  const handleRedirect = () => {
    if (redirectUrl) {
      localStorage.removeItem('redirectUrlAfterPayment');
      window.location.href = redirectUrl;
    }
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
        <div className={`h-1 w-full bg-gradient-to-r from-green-500 via-green-400 to-emerald-300`}></div>
        <div className="pt-10 pb-8 px-8">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className={`rounded-full p-6 ${
              theme === "dark" ? "bg-green-900/30" : "bg-green-100"
            }`}>
              <CheckCircle className={`h-16 w-16 ${
                theme === "dark" ? "text-green-400" : "text-green-600"
              }`} />
            </div>

            <h1 className={`text-3xl font-bold ${
              theme === "dark" ? "text-white" : "text-stone-800"
            }`}>
              Thank You!
            </h1>
            
            <p className={`text-lg ${
              theme === "dark" ? "text-zinc-300" : "text-stone-600"
            }`}>
              Your payment has been successfully received.
            </p>
            
            <p className={`text-sm ${
              theme === "dark" ? "text-zinc-400" : "text-stone-500"
            }`}>
              The transaction will be reflected in your account within a few minutes.
            </p>
            
            {redirectUrl && (
              <div className="mt-2 flex flex-col items-center gap-3">
                <p className={`text-sm ${
                  theme === "dark" ? "text-amber-300" : "text-amber-600"
                }`}>
                  {countdown > 0 
                    ? `Redirecting to homepage in ${countdown} seconds...` 
                    : 'Redirecting...'
                  }
                </p>
                
                <button
                  onClick={handleRedirect}
                  className={`flex items-center gap-2 py-2 px-4 rounded-md ${
                    theme === "dark"
                      ? "bg-indigo-700 hover:bg-indigo-600 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  Redirect Now
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 