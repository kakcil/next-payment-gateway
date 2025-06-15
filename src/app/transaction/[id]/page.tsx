'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiService, Transaction, PaymentMethod, DepositRequest, Bank } from '@/services/api';
import { Search, Wallet, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { handleCancelTransaction } from '@/lib/transactionUtils';

import { CancelDialog } from '@/components/CancelDialog';

//main page component - unwraps params using React.use()
import React from 'react';

export default function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  //unwraps params using React.use()
  const unwrappedParams = React.use(params);
  //passes id from unwrapped params to child component
  return <TransactionContent id={unwrappedParams.id} />;
}

//content component - implements all functionality
function TransactionContent({ id }: { id: string }) {
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [bankList, setBankList] = useState<Bank[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark"); // Default theme is dark
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

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
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  //fetches transaction data when component mounts
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);

        const response = await apiService.getTransaction(id);

        if (response.error) {
          throw new Error(response.error);
        }

        if (!response.data) {
          throw new Error('Transaction data is empty');
        }

        //transaction data received from API
        const transactionData = response.data;

        //state update - async operation may not complete
        //so transactionData is used directly
        setTransaction(transactionData);

        //check if account details exist
        if (transactionData.account && transactionData.account.accountType) {
          proceedToPayment({
            companyTransactionId: transactionData.id,
            accountTypeId: 1 //default value since the account is already selected
          });
          return;
        }

        //process based on payment method
        if (transactionData.paymentMethod === 2) {
          fetchBankList(transactionData);
          return;
        }



        //get cryptocurrency list for Crypto (3)
        if (transactionData.paymentMethod === 3) {
          fetchCryptocurrencyList(transactionData);
          return;
        }

        //default case - fetch payment methods
        fetchPaymentMethods();
        setLoading(false);

      } catch (err) {
        setError('An error occurred while loading transaction data');
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id]);

  //fetches available payment methods
  const fetchPaymentMethods = async () => {
    try {
      const response = await apiService.getPaymentMethods();

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error('Payment methods data is empty');
      }

      //data received from API
      setPaymentMethods(response.data);
    } catch (err) {
      setError('An error occurred while loading payment methods');

      //show fallback methods in case of error
      const fallbackMethods: PaymentMethod[] = [
        { id: 1, name: 'Bitcoin', imageUrl: '' },
        { id: 2, name: 'Ethereum', imageUrl: '' },
        { id: 3, name: 'Litecoin', imageUrl: '' },
        { id: 4, name: 'Tether (TRC20)', imageUrl: '' }
      ];

      setPaymentMethods(fallbackMethods);
    }
  };

  //handles payment method selection
  const handleSelectMethod = (methodId: number) => {
    setSelectedMethod(methodId);
  };

  //handles proceed to payment
  const proceedToPayment = async (paymentData: DepositRequest) => {
    try {
      setLoading(true);

      if (typeof paymentData.companyTransactionId !== 'number') {
        paymentData.companyTransactionId = Number(paymentData.companyTransactionId);
      }

      if (typeof paymentData.accountTypeId !== 'number') {
        paymentData.accountTypeId = Number(paymentData.accountTypeId);
      }

      const response = await apiService.createDeposit(paymentData);

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error('Deposit data is empty');
      }

      router.push(`/transaction/details/${id}`);

    } catch (err) {
      setError('An error occurred while starting payment');
    }
  };

  //handles submit
  const handleSubmit = () => {
    if (!transaction || selectedMethod === null) {
      setError('Please select a payment method');
      return;
    }

    proceedToPayment({
      companyTransactionId: transaction.id,
      accountTypeId: selectedMethod
    });
  };

  //handles cancel
  const handleCancel = async () => {
    await handleCancelTransaction(id, router, setLoading, setError, setCancelDialogOpen);
  };

  //filters payment methods based on search query
  const filteredPaymentMethods = paymentMethods.filter(method =>
    method.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  //gets crypto icon based on name
  const getCryptoIcon = (name: string) => {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('bitcoin')) return <div className={`text-lg ${theme === "dark" ? "text-white" : "text-orange-500"}`}>₿</div>;
    if (lowerName.includes('ethereum')) return <div className={`text-lg ${theme === "dark" ? "text-white" : "text-blue-600"}`}>Ξ</div>;
    if (lowerName.includes('litecoin')) return <div className={`text-lg ${theme === "dark" ? "text-white" : "text-gray-600"}`}>Ł</div>;
    if (lowerName.includes('tether')) return <div className={`text-lg ${theme === "dark" ? "text-white" : "text-green-600"}`}>₮</div>;
    if (lowerName.includes('ripple')) return <div className={`text-lg ${theme === "dark" ? "text-white" : "text-blue-600"}`}>XRP</div>;
    if (lowerName.includes('cardano')) return <div className={`text-lg ${theme === "dark" ? "text-white" : "text-blue-600"}`}>ADA</div>;
    if (lowerName.includes('dogecoin')) return <div className={`text-lg ${theme === "dark" ? "text-white" : "text-yellow-600"}`}>Ð</div>;
    return <div className={`text-lg ${theme === "dark" ? "text-white" : "text-gray-600"}`}>₵</div>; //default crypto symbol
  };

  //gets crypto code from name
  const getCryptoCode = (name: string) => {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('bitcoin')) return "BTC";
    if (lowerName.includes('ethereum')) return "ETH";
    if (lowerName.includes('litecoin')) return "LTC";
    if (lowerName.includes('tether')) return "USDT";
    return "";
  };

  //fetches account types for payment method
  const fetchAccountTypes = async (paymentMethodId: number, transactionData?: Transaction) => {
    try {
      setLoading(true);
      const response = await apiService.getAccountTypes(paymentMethodId);

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error('Account types data is empty');
      }

      //converts account types to payment methods format
      const accountTypesAsPaymentMethods: PaymentMethod[] = response.data.map((accountType: any) => ({
        id: accountType.id,
        name: accountType.name || `Option ${accountType.id}`,
        imageUrl: ''
      }));

      //if only one account type exists, auto-select and proceed
      //DO NOT UPDATE STATE - this prevents showing selection screen
      if (accountTypesAsPaymentMethods.length === 1 && transactionData) {
        //proceed directly to payment
        proceedToPayment({
          companyTransactionId: transactionData.id,
          accountTypeId: accountTypesAsPaymentMethods[0].id
        });
        return; //end process here without updating state
      }

      //if multiple account types exist, ONLY THEN update state and show selection screen
      setPaymentMethods(accountTypesAsPaymentMethods);
      setLoading(false); //only turn off loading if selection screen will be shown

    } catch (err) {
      setError('An error occurred while loading account types');
    }
  };

  //fetches bank list
  const fetchBankList = async (transactionData?: Transaction) => {
    try {
      setLoading(true);
      const response = await apiService.getBankList();

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error('Bank list data is empty');
      }

      //if only one bank exists, auto-select and proceed
      //DO NOT UPDATE STATE - this prevents showing selection screen
      if (response.data.length === 1 && transactionData) {
        //proceed directly to payment
        proceedToPayment({
          companyTransactionId: transactionData.id,
          accountTypeId: response.data[0].id
        });
        return; //end process here without updating state
      }

      //if multiple banks exist, ONLY THEN update state and show selection screen
      setBankList(response.data);
      setLoading(false); //only turn off loading if selection screen will be shown

    } catch (err) {
      setError('An error occurred while loading bank list');
    }
  };

  //fetches cryptocurrency list
  const fetchCryptocurrencyList = async (transactionData?: Transaction) => {
    try {
      setLoading(true);
      const response = await apiService.getCryptocurrencyList();

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error('Cryptocurrency list data is empty');
      }

      //if only one crypto exists, auto-select and proceed
      //DO NOT UPDATE STATE - this prevents showing selection screen
      if (response.data.length === 1 && transactionData) {
        //proceed directly to payment
        proceedToPayment({
          companyTransactionId: transactionData.id,
          accountTypeId: response.data[0].id
        });
        return; //end process here without updating state
      }

      //if multiple cryptos exist, ONLY THEN update state and show selection screen
      setBankList(response.data); // Using same state as banks for display
      setLoading(false); //only turn off loading if selection screen will be shown

    } catch (err) {
      setError('An error occurred while loading cryptocurrency list');
    }
  };

  //filters bank list based on search query
  const filteredBankList = bankList.filter(bank =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  //gets bank icon based on name
  const getBankIcon = (name: string) => {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('akbank')) return 'A';
    if (lowerName.includes('garanti')) return 'G';
    if (lowerName.includes('işbank') || lowerName.includes('is bank')) return 'İ';
    if (lowerName.includes('ziraat')) return 'Z';
    if (lowerName.includes('yapı') || lowerName.includes('yapi')) return 'Y';
    if (lowerName.includes('vakıf') || lowerName.includes('vakif')) return 'V';
    return 'B'; // Default bank symbol
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
        <div className={`${theme === "dark" ? "bg-red-900/30 border-red-700 text-red-200" : "bg-red-100 border-red-400 text-red-700"} px-4 py-3 rounded relative`} role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className={`flex justify-center items-center min-h-screen p-4 ${theme === "dark" ? "bg-neutral-900" : "bg-stone-50"}`}>
        <div className={`${theme === "dark" ? "bg-yellow-900/30 border-yellow-700 text-yellow-200" : "bg-yellow-100 border-yellow-400 text-yellow-700"} px-4 py-3 rounded relative`} role="alert">
          <strong className="font-bold">Warning! </strong>
          <span className="block sm:inline">Transaction not found.</span>
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
        <div className="pt-6 p-6">
          <h1 className={`text-2xl font-bold text-center mb-6 ${theme === "dark" ? "text-white" : "text-stone-800"
            }`}>
            {transaction?.paymentMethod === 2 ? 'Bank Transfer' : 'Deposit'}
          </h1>

          <div className={`flex items-center gap-2 mb-5 p-3 rounded-lg ${theme === "dark" ? "bg-zinc-800/50" : "bg-stone-100"
            }`}>
            <div className={`rounded-full p-2 ${theme === "dark" ? "bg-cyan-900/50" : "bg-cyan-100"
              }`}>
              {transaction?.paymentMethod === 2 ? (
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${theme === "dark" ? "text-cyan-400" : "text-cyan-600"
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              ) : (
                <Wallet className={`h-5 w-5 ${theme === "dark" ? "text-cyan-400" : "text-cyan-600"
                  }`} />
              )}
            </div>
            <div>
              <div className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-stone-500"
                }`}>Payment Method</div>
              <div className={`font-medium ${theme === "dark" ? "text-zinc-200" : "text-stone-800"
                }`}>
                {transaction?.paymentMethod === 2
                  ? 'Bank Transfer'
                  : transaction?.paymentMethod === 3
                    ? 'Cryptocurrency'
                      : ''}
              </div>
            </div>
          </div>

          {transaction?.paymentMethod === 2 ? (
            filteredBankList.length > 1 && (
              <div className="mb-4">
                <div className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-zinc-400" : "text-stone-600"
                  }`}>
                  Select Bank
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className={`h-5 w-5 ${theme === "dark" ? "text-zinc-500" : "text-stone-400"
                        }`} />
                    </div>
                    <input
                      type="text"
                      className={`pl-10 pr-4 py-3 w-full rounded-lg focus:ring-cyan-500 focus:border-cyan-500 ${theme === "dark"
                          ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
                          : "bg-white border-stone-300 text-stone-700 placeholder-stone-400"
                        }`}
                      placeholder="Please select a bank..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className={`max-h-60 overflow-y-auto rounded-md border ${theme === "dark"
                      ? "border-zinc-700 bg-zinc-800/50"
                      : "border-stone-200 bg-white"
                    }`}
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: theme === "dark" ? 'rgba(34, 211, 238, 0.5) rgba(30, 30, 46, 0.5)' : 'rgba(34, 211, 238, 0.3) rgba(243, 244, 246, 0.5)'
                    }}
                  >
                    <style jsx global>{`
                      .overflow-y-auto::-webkit-scrollbar {
                        width: 8px;
                      }
                      .overflow-y-auto::-webkit-scrollbar-track {
                        background: ${theme === "dark" ? 'rgba(30, 30, 46, 0.5)' : 'rgba(243, 244, 246, 0.5)'};
                        border-radius: 6px;
                      }
                      .overflow-y-auto::-webkit-scrollbar-thumb {
                        background: ${theme === "dark" ? 'rgba(34, 211, 238, 0.5)' : 'rgba(34, 211, 238, 0.3)'};
                        border-radius: 6px;
                      }
                      .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                        background: ${theme === "dark" ? 'rgba(34, 211, 238, 0.7)' : 'rgba(34, 211, 238, 0.5)'};
                      }
                    `}</style>
                    {filteredBankList.length > 0 ? (
                      filteredBankList.map((bank) => (
                        <div
                          key={bank.id}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-all rounded-md my-1 ${theme === "dark"
                              ? "border-b border-zinc-700 last:border-b-0 hover:bg-zinc-800/20"
                              : "border-b border-stone-200 last:border-b-0 hover:bg-stone-50"
                            } ${selectedMethod === bank.id
                              ? theme === "dark"
                                ? "bg-cyan-900/30 border-l-4 border-l-cyan-500"
                                : "bg-cyan-50 border-l-4 border-l-cyan-500"
                              : "border-l-4 border-l-transparent"
                            }`}
                          onClick={() => handleSelectMethod(bank.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${selectedMethod === bank.id
                                ? theme === "dark" ? "bg-cyan-900/50 text-cyan-400" : "bg-cyan-100 text-cyan-600"
                                : theme === "dark" ? "bg-zinc-800 text-zinc-400" : "bg-stone-100 text-stone-500"
                              }`}>
                              {getBankIcon(bank.name)}
                            </div>
                            <div>
                              <p className={`font-medium ${selectedMethod === bank.id
                                  ? theme === "dark" ? "text-cyan-300" : "text-cyan-700"
                                  : theme === "dark" ? "text-zinc-300" : "text-stone-700"
                                }`}>
                                {bank.name}
                              </p>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${selectedMethod === bank.id
                              ? theme === "dark" ? "border-cyan-500 bg-cyan-500" : "border-cyan-600 bg-cyan-600"
                              : theme === "dark" ? "border-gray-600" : "border-gray-300"
                            }`}>
                            {selectedMethod === bank.id && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      !loading && (
                        <div className={`p-4 text-center ${theme === "dark" ? "text-zinc-500" : "text-stone-400"
                          }`}>No results found</div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          ) : transaction?.paymentMethod === 3 ? (
            filteredBankList.length > 0 && (
              <div className="mb-4">
                <div className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-zinc-400" : "text-stone-600"
                  }`}>
                  Select Cryptocurrency
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className={`h-5 w-5 ${theme === "dark" ? "text-zinc-500" : "text-stone-400"
                        }`} />
                    </div>
                    <input
                      type="text"
                      className={`pl-10 pr-4 py-3 w-full rounded-lg focus:ring-cyan-500 focus:border-cyan-500 ${theme === "dark"
                          ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
                          : "bg-white border-stone-300 text-stone-700 placeholder-stone-400"
                        }`}
                      placeholder="Please select crypto..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className={`max-h-60 overflow-y-auto rounded-md border ${theme === "dark"
                      ? "border-zinc-700 bg-zinc-800/50"
                      : "border-stone-200 bg-white"
                    }`}
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: theme === "dark" ? 'rgba(34, 211, 238, 0.5) rgba(30, 30, 46, 0.5)' : 'rgba(34, 211, 238, 0.3) rgba(243, 244, 246, 0.5)'
                    }}
                  >
                    <style jsx global>{`
                      .overflow-y-auto::-webkit-scrollbar {
                        width: 8px;
                      }
                      .overflow-y-auto::-webkit-scrollbar-track {
                        background: ${theme === "dark" ? 'rgba(30, 30, 46, 0.5)' : 'rgba(243, 244, 246, 0.5)'};
                        border-radius: 6px;
                      }
                      .overflow-y-auto::-webkit-scrollbar-thumb {
                        background: ${theme === "dark" ? 'rgba(34, 211, 238, 0.5)' : 'rgba(34, 211, 238, 0.3)'};
                        border-radius: 6px;
                      }
                      .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                        background: ${theme === "dark" ? 'rgba(34, 211, 238, 0.7)' : 'rgba(34, 211, 238, 0.5)'};
                      }
                    `}</style>
                    {filteredBankList.length > 0 ? (
                      filteredBankList.map((crypto) => (
                        <div
                          key={crypto.id}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-all rounded-md my-1 ${theme === "dark"
                              ? "border-b border-zinc-700 last:border-b-0 hover:bg-zinc-800/20"
                              : "border-b border-stone-200 last:border-b-0 hover:bg-stone-50"
                            } ${selectedMethod === crypto.id
                              ? theme === "dark"
                                ? "bg-cyan-900/30 border-l-4 border-l-cyan-500"
                                : "bg-cyan-50 border-l-4 border-l-cyan-500"
                              : "border-l-4 border-l-transparent"
                            }`}
                          onClick={() => handleSelectMethod(crypto.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`flex-shrink-0 ${selectedMethod === crypto.id
                                ? theme === "dark" ? "text-cyan-400" : "text-cyan-600"
                                : theme === "dark" ? "text-zinc-400" : "text-stone-500"
                              }`}>
                              {getCryptoIcon(crypto.name)}
                            </div>
                            <div>
                              <p className={`font-medium ${selectedMethod === crypto.id
                                  ? theme === "dark" ? "text-cyan-300" : "text-cyan-700"
                                  : theme === "dark" ? "text-zinc-300" : "text-stone-700"
                                }`}>
                                {crypto.name}
                              </p>
                              <p className={`text-sm ${selectedMethod === crypto.id
                                  ? theme === "dark" ? "text-cyan-400/70" : "text-cyan-600/70"
                                  : theme === "dark" ? "text-zinc-500" : "text-stone-500"
                                }`}>
                                {crypto.swiftCode}
                              </p>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${selectedMethod === crypto.id
                              ? theme === "dark" ? "border-cyan-500 bg-cyan-500" : "border-cyan-600 bg-cyan-600"
                              : theme === "dark" ? "border-gray-600" : "border-gray-300"
                            }`}>
                            {selectedMethod === crypto.id && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      !loading && (
                        <div className={`p-4 text-center ${theme === "dark" ? "text-zinc-500" : "text-stone-400"
                          }`}>No results found</div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          ) : (
            filteredPaymentMethods.length > 1 && (
              <div className="mb-4">
                <div className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-zinc-400" : "text-stone-600"
                  }`}>
                  Select Cryptocurrency
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className={`h-5 w-5 ${theme === "dark" ? "text-zinc-500" : "text-stone-400"
                        }`} />
                    </div>
                    <input
                      type="text"
                      className={`pl-10 pr-4 py-3 w-full rounded-lg focus:ring-cyan-500 focus:border-cyan-500 ${theme === "dark"
                          ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
                          : "bg-white border-stone-300 text-stone-700 placeholder-stone-400"
                        }`}
                      placeholder="Please select crypto..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className={`max-h-60 overflow-y-auto rounded-md border ${theme === "dark"
                      ? "border-zinc-700 bg-zinc-800/50"
                      : "border-stone-200 bg-white"
                    }`}
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: theme === "dark" ? 'rgba(34, 211, 238, 0.5) rgba(30, 30, 46, 0.5)' : 'rgba(34, 211, 238, 0.3) rgba(243, 244, 246, 0.5)'
                    }}
                  >
                    <style jsx global>{`
                      .overflow-y-auto::-webkit-scrollbar {
                        width: 8px;
                      }
                      .overflow-y-auto::-webkit-scrollbar-track {
                        background: ${theme === "dark" ? 'rgba(30, 30, 46, 0.5)' : 'rgba(243, 244, 246, 0.5)'};
                        border-radius: 6px;
                      }
                      .overflow-y-auto::-webkit-scrollbar-thumb {
                        background: ${theme === "dark" ? 'rgba(34, 211, 238, 0.5)' : 'rgba(34, 211, 238, 0.3)'};
                        border-radius: 6px;
                      }
                      .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                        background: ${theme === "dark" ? 'rgba(34, 211, 238, 0.7)' : 'rgba(34, 211, 238, 0.5)'};
                      }
                    `}</style>
                    {filteredPaymentMethods.length > 0 ? (
                      filteredPaymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-all rounded-md my-1 ${theme === "dark"
                              ? "border-b border-zinc-700 last:border-b-0 hover:bg-zinc-800/20"
                              : "border-b border-stone-200 last:border-b-0 hover:bg-stone-50"
                            } ${selectedMethod === method.id
                              ? theme === "dark"
                                ? "bg-cyan-900/30 border-l-4 border-l-cyan-500"
                                : "bg-cyan-50 border-l-4 border-l-cyan-500"
                              : "border-l-4 border-l-transparent"
                            }`}
                          onClick={() => handleSelectMethod(method.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`flex-shrink-0 ${selectedMethod === method.id
                                ? theme === "dark" ? "text-cyan-400" : "text-cyan-600"
                                : theme === "dark" ? "text-zinc-400" : "text-stone-500"
                              }`}>
                              {getCryptoIcon(method.name)}
                            </div>
                            <div>
                              <p className={`font-medium ${selectedMethod === method.id
                                  ? theme === "dark" ? "text-cyan-300" : "text-cyan-700"
                                  : theme === "dark" ? "text-zinc-300" : "text-stone-700"
                                }`}>
                                {method.name}
                              </p>
                              <p className={`text-sm ${selectedMethod === method.id
                                  ? theme === "dark" ? "text-cyan-400/70" : "text-cyan-600/70"
                                  : theme === "dark" ? "text-zinc-500" : "text-stone-500"
                                }`}>
                                {getCryptoCode(method.name)}
                              </p>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${selectedMethod === method.id
                              ? theme === "dark" ? "border-cyan-500 bg-cyan-500" : "border-cyan-600 bg-cyan-600"
                              : theme === "dark" ? "border-gray-600" : "border-gray-300"
                            }`}>
                            {selectedMethod === method.id && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      !loading && (
                        <div className={`p-4 text-center ${theme === "dark" ? "text-zinc-500" : "text-stone-400"
                          }`}>No results found</div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {((transaction?.paymentMethod === 2 && filteredBankList.length > 0) || (transaction?.paymentMethod === 3 && filteredBankList.length > 0)) && (
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
                onClick={handleSubmit}
                disabled={selectedMethod === null}
                className={cn(
                  "w-1/2 text-white border-0 rounded-md py-2.5 px-4 flex gap-2 items-center justify-center group",
                  selectedMethod === null
                    ? theme === "dark" ? "bg-cyan-800/50 cursor-not-allowed" : "bg-cyan-400/50 cursor-not-allowed"
                    : theme === "dark" ? "bg-cyan-600 hover:bg-cyan-500" : "bg-cyan-500 hover:bg-cyan-600"
                )}
              >
                Continue
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          )}
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