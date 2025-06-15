'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiService, DepositResponse } from '@/services/api';
import { Check, Copy, AlertCircle, Clock, Wallet, X } from 'lucide-react';
import { handleCancelTransaction } from '@/lib/transactionUtils';
import { CancelDialog } from '@/components/CancelDialog';

//main page component
export default function PaymentDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [paymentDetails, setPaymentDetails] = useState<DepositResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [progress, setProgress] = useState(100);
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [showQR, setShowQR] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  //fetch payment details
  const fetchPaymentDetails = useCallback(async () => {
    try {
      // First get transaction data to get the ID
      const transactionResponse = await apiService.getTransaction(id);

      if (transactionResponse.error) {
        throw new Error(transactionResponse.error);
      }

      if (!transactionResponse.data) {
        throw new Error('Transaction data is empty');
      }

      const transaction = transactionResponse.data;

      // Create deposit to get payment details
      const depositResponse = await apiService.createDeposit({
        companyTransactionId: transaction.id,
        accountTypeId: 1 // Default account type
      });

      if (depositResponse.error) {
        throw new Error(depositResponse.error);
      }

      if (!depositResponse.data) {
        throw new Error('Deposit data is empty');
      }

      if (transaction.redirectUrlAfterUserPayment) {
        try {
          localStorage.setItem('redirectUrlAfterPayment', transaction.redirectUrlAfterUserPayment);
        } catch (err) {
          // Ignore localStorage errors
        }
      }

      setPaymentDetails(depositResponse.data);
      setLoading(false);
    } catch (err) {
      setError('An error occurred while loading payment details');
      setLoading(false);
    }
  }, [id]);

  //initial data fetch
  useEffect(() => {
    fetchPaymentDetails();
  }, [fetchPaymentDetails]);

  //theme effect
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark");
      document.body.classList.remove("light");
    } else {
      document.body.classList.add("light");
      document.body.classList.remove("dark");
    }
  }, [theme]);

  //timer effect
  useEffect(() => {
    if (!paymentDetails?.expireTime) return;

    try {
      const expireTime = new Date(paymentDetails.expireTime).getTime();
      const now = new Date().getTime();
      const startTimeKey = `paymentStartTime_${id}`;
      let startTime;

      try {
        const savedStartTime = localStorage.getItem(startTimeKey);
        if (savedStartTime) {
          startTime = parseInt(savedStartTime);
        } else {
          startTime = now;
          localStorage.setItem(startTimeKey, startTime.toString());
        }
      } catch {
        startTime = now;
      }
      
      const totalDuration = expireTime - startTime;

      const updateTimer = () => {
        const currentTime = new Date().getTime();
        const remainingTime = expireTime - currentTime;

        if (remainingTime <= 0) {
          setTimeLeft('00:00');
          setProgress(0);
          router.push('/timeout');
          return false;
        }

        const remainingSeconds = Math.floor(remainingTime / 1000);
        const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
        const seconds = (remainingSeconds % 60).toString().padStart(2, '0');
        setTimeLeft(`${minutes}:${seconds}`);

        const progressValue = (remainingTime / totalDuration) * 100;
        const newProgress = Math.max(0, Math.min(100, progressValue));
        setProgress(newProgress);

        return true;
      };

      if (!updateTimer()) return;

      const intervalId = setInterval(updateTimer, 100);
      return () => clearInterval(intervalId);

    } catch {
      setTimeLeft('--:--');
      setProgress(100);
    }
  }, [paymentDetails, router, id]);

  //toggles between dark and light theme
  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  //calculates color based on time remaining
  const getColorClass = () => {
    if (progress >= 50) {
      return theme === "dark" ? "text-green-400" : "text-green-600";
    } else if (progress >= 20) {
      return theme === "dark" ? "text-yellow-400" : "text-yellow-600";
    } else {
      return theme === "dark" ? "text-red-400" : "text-red-600";
    }
  };

    //handles payment completion
  const handlePaymentComplete = () => {
    //removes start time from localStorage when transaction completes
    try {
      const startTimeKey = `paymentStartTime_${id}`;
      localStorage.removeItem(startTimeKey);
      console.log('Removed start time from localStorage for completed transaction:', id);
    } catch (err) {
      console.error('LocalStorage remove error:', err);
    }
    
    //redirects to thankyou page - redirect URL will be handled there
    router.push('/thankyou');
  };

  //handles payment cancellation
  const handleCancel = async () => {
    await handleCancelTransaction(id, router, setLoading, setError, setCancelDialogOpen);
  };

  //copies to clipboard function
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(prev => ({ ...prev, [field]: true }));
        setTimeout(() => {
          setCopied(prev => ({ ...prev, [field]: false }));
        }, 2000);
      })
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${theme === "dark" ? "bg-neutral-900" : "bg-stone-50"}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${theme === "dark" ? "border-cyan-400" : "border-teal-600"}`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex justify-center items-center min-h-screen p-4 ${theme === "dark" ? "bg-neutral-900" : "bg-stone-50"}`}>
        <div className={`${theme === "dark" ? "bg-red-900/30 border-red-700 text-red-200" : "bg-red-100 border-red-400 text-red-700"} px-4 py-3 rounded relative border`} role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!paymentDetails) {
    return (
      <div className={`flex justify-center items-center min-h-screen p-4 ${theme === "dark" ? "bg-neutral-900" : "bg-stone-50"}`}>
        <div className={`${theme === "dark" ? "bg-yellow-900/30 border-yellow-700 text-yellow-200" : "bg-yellow-100 border-yellow-400 text-yellow-700"} px-4 py-3 rounded relative border`} role="alert">
          <strong className="font-bold">Warning! </strong>
          <span className="block sm:inline">Payment details not found.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 p-4 ${theme === "dark"
        ? "bg-gradient-to-br from-neutral-900 to-slate-900"
        : "bg-gradient-to-br from-cyan-50 to-teal-50"
      }`}>
      <div className="absolute top-4 right-4 flex gap-2">
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

      <div className="absolute top-4 left-4">
        <div className="flex items-center gap-1">
                      <div className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Next Payment Gateway
          </div>
        </div>
      </div>

      <div className={`w-full max-w-md backdrop-blur-md shadow-xl border-0 rounded-xl overflow-hidden transition-all duration-300 ${theme === "dark"
          ? "bg-gray-900/80 border-gray-800"
          : "bg-white/90"
        }`}>
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500"></div>
        <div className="pt-6 px-6 pb-6">
          <h1 className={`text-2xl font-bold text-center mb-6 ${theme === "dark" ? "text-white" : "text-stone-800"
            }`}>
            {paymentDetails.merchantPaymentMethodId === 2
                ? 'Bank Transfer'
                : paymentDetails.merchantPaymentMethodId === 3
                  ? 'Cryptocurrency'
                  : 'Payment'}
          </h1>

          <div className="space-y-5">
            {/* Wallet/IBAN Address Section */}
            <div>
              <div className={`flex items-center gap-2 mb-2 p-3 rounded-lg relative ${theme === "dark" ? "bg-zinc-800/50" : "bg-stone-100"
                }`}>
                <div className={`rounded-full p-2 ${theme === "dark" ? "bg-indigo-900/50" : "bg-indigo-100"
                  }`}>
                  <Wallet className={`h-5 w-5 ${theme === "dark" ? "text-indigo-400" : "text-indigo-600"
                    }`} />
                </div>
                <div className="flex-grow">
                  <div className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-stone-500"
                    }`}>{paymentDetails.merchantPaymentMethodId === 3 || paymentDetails.accountType.includes('CRYPTO') ? 'Wallet' : 'IBAN'}</div>
                  <div className={`font-medium flex items-center gap-2 ${theme === "dark" ? "text-zinc-200" : "text-stone-800"
                    }`}>
                    <span className="break-all">{paymentDetails.address}</span>
                    <button
                      onClick={() => copyToClipboard(paymentDetails.address, 'address')}
                      className={`h-7 w-7 p-0 inline-flex items-center justify-center rounded-md shrink-0 ${theme === "dark"
                          ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
                          : "text-stone-500 hover:text-stone-700 hover:bg-stone-200"
                        }`}
                    >
                      {copied['address'] ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Show QR Code button - top right */}
                <button
                  onClick={() => setShowQR(true)}
                  className={`text-xs absolute top-2 right-2 flex items-center gap-1 rounded-md py-1 px-2 ${theme === "dark"
                      ? "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/40 border border-indigo-800/40"
                      : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200"
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5v4a1 1 0 01-2 0V4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-2 0V5h-3a1 1 0 010-2zM3 16a1 1 0 011-1h4a1 1 0 010 2H4v-1zm11-1a1 1 0 00-1 1v1h3a1 1 0 002 0v-4a1 1 0 00-2 0v2h-2z" clipRule="evenodd" />
                  </svg>
                  QR
                </button>
              </div>
            </div>

            {/* QR Code Section (if applicable and shown) */}
            {showQR && (
              <div className="flex justify-center my-5">
                <div className={`p-4 border rounded relative ${theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-stone-300 border-stone-300"
                  }`}>
                  <button
                    onClick={() => setShowQR(false)}
                    className={`absolute -top-2 -right-2 rounded-full p-1 ${theme === "dark" ? "bg-zinc-700 text-zinc-300 hover:bg-zinc-600" : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                      }`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex flex-col items-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(paymentDetails.address)}`}
                      alt="QR Kod"
                      className="w-32 h-32"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Account Owner Section */}
            {paymentDetails.merchantPaymentMethodId !== 3 && (
              <div>
                <div className={`flex items-center gap-2 p-3 rounded-lg ${theme === "dark" ? "bg-zinc-800/50" : "bg-stone-100"
                  }`}>
                  <div className={`rounded-full p-2 ${theme === "dark" ? "bg-indigo-900/50" : "bg-indigo-100"
                    }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${theme === "dark" ? "text-indigo-400" : "text-indigo-600"
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-stone-500"
                      }`}>Account Owner</div>
                    <div className={`font-medium flex items-center gap-2 ${theme === "dark" ? "text-zinc-200" : "text-stone-800"
                      }`}>
                      <span>{paymentDetails.fullName}</span>
                      <button
                        onClick={() => copyToClipboard(paymentDetails.fullName, 'account')}
                        className={`h-7 w-7 p-0 inline-flex items-center justify-center rounded-md shrink-0 ${theme === "dark"
                            ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
                            : "text-stone-500 hover:text-stone-700 hover:bg-stone-200"
                          }`}
                      >
                        {copied['account'] ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Amount Section */}
            <div>
              <div className={`flex items-center gap-2 p-3 rounded-lg ${theme === "dark" ? "bg-zinc-800/50" : "bg-stone-100"
                }`}>
                <div className={`rounded-full p-2 ${theme === "dark" ? "bg-indigo-900/50" : "bg-indigo-100"
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${theme === "dark" ? "text-indigo-400" : "text-indigo-600"
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-stone-500"
                    }`}>Amount</div>
                  <div className={`font-medium flex items-center gap-2 ${theme === "dark" ? "text-zinc-200" : "text-stone-800"
                    }`}>
                    <span>
                      {paymentDetails.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {paymentDetails.cryptocurrency ? ` ${paymentDetails.cryptocurrency}` : paymentDetails.currency ? ` ${paymentDetails.currency}` : ''}
                    </span>
                    <button
                      onClick={() => copyToClipboard(paymentDetails.amount.toString(), 'amount')}
                      className={`h-7 w-7 p-0 inline-flex items-center justify-center rounded-md shrink-0 ${theme === "dark"
                          ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
                          : "text-stone-500 hover:text-stone-700 hover:bg-stone-200"
                        }`}
                    >
                      {copied['amount'] ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Alert */}
            <div className={`relative w-full rounded-lg border p-4 ${theme === "dark"
                ? "bg-blue-900/30 border-blue-800/60"
                : "bg-blue-50 border-blue-200"
              }`}>
              <div className="flex">
                <AlertCircle className={`h-5 w-5 mr-2 ${theme === "dark" ? "text-blue-400" : "text-blue-600"
                  }`} />
                <div>
                  <h5 className={`mb-1 font-medium leading-none tracking-tight ${theme === "dark" ? "text-blue-300" : "text-blue-600"
                    }`}>
                    Please do not add any description
                  </h5>
                  <div className={`text-sm ${theme === "dark" ? "text-blue-200/70" : "text-stone-600"
                    }`}>
                    Send only the specified amount.
                  </div>
                </div>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="mt-4">
              <div className="space-y-3">
                <div className={`flex justify-between items-center rounded-lg p-4 ${theme === "dark" ? "bg-zinc-800" : "bg-stone-100"
                  }`}>
                  <div className="flex items-center gap-2">
                    <Clock className={`w-5 h-5 ${getColorClass()}`} />
                                         <div className={`text-xs uppercase font-medium tracking-wider ${theme === "dark" ? "text-zinc-400" : "text-stone-500"
                       }`}>Time Remaining</div>
                  </div>

                  <div className={`flex items-center gap-2 ${getColorClass()} font-mono font-bold text-lg`}>
                    {timeLeft}
                    <span className="animate-pulse">•</span>
                  </div>
                </div>

                <div className={`relative h-4 w-full overflow-hidden rounded-full ${theme === "dark" ? "bg-zinc-700" : "bg-stone-200"}`}>
                  <div
                    className={`h-full transition-all duration-100 ease-linear ${
                      progress >= 50
                        ? "bg-green-500"
                        : progress >= 20
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{
                      width: `${progress}%`
                    }}
                  />
                </div>
                {/* Hidden debug info (remove in production) */}
                <div className="hidden">
                  <span>Debug - Progress: {progress.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className={`relative w-full rounded-lg border p-4 ${theme === "dark"
                ? "bg-amber-900/30 border-amber-800/60"
                : "bg-amber-50 border-amber-200"
              }`}>
              <div className="flex items-start">
                <AlertCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${theme === "dark" ? "text-amber-400" : "text-amber-600"
                  }`} />
                <div>
                  <h5 className={`mb-1 font-medium leading-none tracking-tight ${theme === "dark" ? "text-amber-300" : "text-amber-700"
                    }`}>
                    Please make the deposit within the given time.
                  </h5>
                  <div className={`text-sm ${theme === "dark" ? "text-amber-200/70" : "text-amber-600"
                    }`}>
                    Transactions below the limit are not refunded.
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                className={`w-1/2 border rounded-md py-2.5 px-4 flex gap-2 items-center justify-center ${theme === "dark"
                    ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    : "border-stone-300 text-stone-700 hover:bg-stone-100"
                  }`}
                onClick={() => setCancelDialogOpen(true)}
              >
                <X className="w-4 h-4" />
                Cancel
              </button>

              <button
                onClick={handlePaymentComplete}
                className={`w-1/2 text-white border-0 rounded-md py-2.5 px-4 flex gap-2 items-center justify-center ${theme === "dark"
                    ? "bg-green-600 hover:bg-green-500"
                    : "bg-green-500 hover:bg-green-600"
                  }`}
              >
                <Check className="w-4 h-4" />
                Payment Completed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <CancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancel}
        theme={theme}
      />
    </div>
  );
} 