// Service for making requests from frontend to backend API routes
// This way there will be no API key exposure on the client side

import { API_CONFIG, getApiHeaders } from '@/config/api';

//defines api response type
export type ApiResponse<T = any> = {
  data?: T;
  error?: string;
  status: number;
};

//defines transaction type
export type Transaction = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  amount: number;
  currency: string;
  cryptoAmount: number;
  cryptocurrency: string | null;
  transactionType: number;
  transactionStatus: number;
  paymentMethod: number;
  reference: string;
  uniqueKey: string;
  redirectUrlAfterUserPayment: string;
  addDate: string;
  account: {
    fullName: string;
    accountType: string;
    address: string;
    url: string;
    redirectToUrl: boolean;
    expireTime: string;
  } | null;
};

//defines payment method type
export type PaymentMethod = {
  id: number;
  name: string;
  imageUrl: string;
};

//defines bank type
export type Bank = {
  id: number;
  accountGroup: number;
  swiftCode: string;
  name: string;
  code: string | null;
};

//defines deposit request type
export type DepositRequest = {
  companyTransactionId: number;
  accountTypeId: number;
};

//defines deposit response type
export type DepositResponse = {
  isSuccess: boolean;
  message: string | null;
  orderId: string;
  fullName: string;
  accountType: string;
  address: string;
  url: string;
  redirectToUrl: boolean;
  amount: number;
  currency: string;
  cryptoAmount: number;
  cryptocurrency: string;
  merchantPaymentMethodId: number;
  expireTime: string;
  addDate: string;
  merchantTransactionId: number;
};

//handles api requests
const fetchApi = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    //checks response status
    if (!response.ok) {
      return {
        error: `API error: ${response.status} ${response.statusText}`,
        status: response.status,
      };
    }
    
    //checks response content
    const text = await response.text();
    
    //checks for empty response
    if (!text || text.trim() === '') {
      return {
        error: 'API returned empty response',
        status: response.status,
      };
    }
    
    //parses json safely
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      return {
        error: 'Invalid JSON response from API',
        status: response.status,
      };
    }
    
    return {
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      error: 'An error occurred during the request',
      status: 500,
    };
  }
};

//handles external api requests
const fetchExternalApi = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const baseUrl = API_CONFIG.BASE_URL;
    const fullUrl = `${baseUrl}${endpoint}`;
    
    const headers = getApiHeaders();
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
    
    //checks response status
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        error: `API error: ${response.status} ${response.statusText} - ${errorText}`,
        status: response.status,
      };
    }
    
    //checks response content
    const text = await response.text();
    
    //checks for empty response
    if (!text || text.trim() === '') {
      return {
        data: {} as T, //returns empty object for empty response
        status: response.status,
      };
    }
    
    //parses json safely
    let data;
    try {
      //handles non-json responses as text
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        data = JSON.parse(text);
      } else {
        //wraps text response in object
        data = { message: text } as any;
      }
    } catch (parseError) {
      return {
        error: 'Invalid JSON response from API',
        status: response.status,
      };
    }
    
    return {
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      error: 'An error occurred during the request',
      status: 500,
    };
  }
};

//provides api service functions
export const apiService = {
  //gets transaction details
  getTransaction: async (id: string): Promise<ApiResponse<Transaction>> => {
    try {
      //loads test data from json
      const response = await fetch('/test-data.json');
      const data = await response.json();
      
      //finds transaction first from json if not found creates dynamic one
      let transaction = data.transactions.find((t: any) => t.id === id);
      
      //creates dynamic transaction using defaulttransaction if not found in json
      if (!transaction) {
        const parts = id.split('_');
        if (parts.length >= 3) {
          const method = parts[1]; //crypto bank card
          const timestamp = parseInt(parts[2]); //timestamp from id
          const defaultTx = data.defaultTransaction;
          
          //calculate expire time based on original timestamp
          const createdAt = new Date(timestamp);
          const expireTime = new Date(createdAt.getTime() + (defaultTx.expireMinutes || 1) * 60 * 1000);
          
          transaction = {
            id: id,
            amount: defaultTx.amount,
            currency: defaultTx.currency,
            method: method,
            status: defaultTx.status,
            timestamp: createdAt.toISOString(),
            description: defaultTx.descriptions[method] || `Test ${method} payment`,
            expireMinutes: defaultTx.expireMinutes,
            expireTime: expireTime.toISOString()
          };
        } else {
          return {
            error: 'Transaction not found',
            status: 404,
          };
        }
      }

      //converts transaction to api format
      const apiTransaction: Transaction = {
        id: parseInt(transaction.id.replace('tx_', '').replace('test_', '').replace(/[^0-9]/g, '')) || Math.floor(Math.random() * 1000),
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        amount: transaction.amount || 100,
        currency: transaction.currency || 'USD',
        cryptoAmount: transaction.amount || 100,
        cryptocurrency: transaction.method === 'crypto' ? 'BTC' : null,
        transactionType: 1,
        transactionStatus: transaction.status === 'completed' ? 2 : transaction.status === 'pending' ? 1 : 3,
        paymentMethod: transaction.method === 'crypto' ? 3 : transaction.method === 'bank' ? 2 : 1,
        reference: transaction.id,
        uniqueKey: transaction.id,
        redirectUrlAfterUserPayment: '',
        addDate: transaction.timestamp || new Date().toISOString(),
        account: null
      };

      return {
        data: apiTransaction,
        status: 200,
      };
    } catch (error) {
      return {
        error: 'Failed to load test data',
        status: 500,
      };
    }
  },
  
  //gets payment methods
  getPaymentMethods: async (): Promise<ApiResponse<PaymentMethod[]>> => {
    try {
      const response = await fetch('/test-data.json');
      const data = await response.json();
      
      const paymentMethods: PaymentMethod[] = data.paymentMethods.map((method: any, index: number) => ({
        id: index + 1,
        name: method.name,
        imageUrl: ''
      }));

      return {
        data: paymentMethods,
        status: 200,
      };
    } catch (error) {
      return {
        error: 'Failed to load payment methods',
        status: 500,
      };
    }
  },
  
  //gets bank list
  getBankList: async (): Promise<ApiResponse<Bank[]>> => {
    try {
      const response = await fetch('/test-data.json');
      const data = await response.json();
      
      const banks: Bank[] = data.banks;

      return {
        data: banks,
        status: 200,
      };
    } catch (error) {
      return {
        error: 'Failed to load bank list',
        status: 500,
      };
    }
  },
  
  //gets cryptocurrency list
  getCryptocurrencyList: async (): Promise<ApiResponse<Bank[]>> => {
    try {
      const response = await fetch('/test-data.json');
      const data = await response.json();
      
      const cryptocurrencies: Bank[] = data.cryptocurrencies;

      return {
        data: cryptocurrencies,
        status: 200,
      };
    } catch (error) {
      return {
        error: 'Failed to load cryptocurrency list',
        status: 500,
      };
    }
  },
  
  //gets account types
  getAccountTypes: async (_paymentMethod: number): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch('/test-data.json');
      const data = await response.json();
      
      const accountTypes = data.accountTypes.map((type: any, index: number) => ({
        id: index + 1,
        name: type.name,
        features: type.features
      }));

      return {
        data: accountTypes,
        status: 200,
      };
    } catch (error) {
      return {
        error: 'Failed to load account types',
        status: 500,
      };
    }
  },
  
  //creates deposit transaction
  createDeposit: async (data: DepositRequest): Promise<ApiResponse<DepositResponse>> => {
    try {
      const response = await fetch('/test-data.json');
      const jsonData = await response.json();
      
      const depositTemplate = jsonData.depositResponse;
      const depositResponse: DepositResponse = {
        isSuccess: depositTemplate.isSuccess,
        message: depositTemplate.message,
        orderId: `order_${Date.now()}`,
        fullName: depositTemplate.fullName,
        accountType: depositTemplate.accountType,
        address: depositTemplate.address,
        url: depositTemplate.url,
        redirectToUrl: depositTemplate.redirectToUrl,
        amount: depositTemplate.amount,
        currency: depositTemplate.currency,
        cryptoAmount: depositTemplate.cryptoAmount,
        cryptocurrency: depositTemplate.cryptocurrency,
        merchantPaymentMethodId: data.accountTypeId,
        expireTime: new Date(Date.now() + (depositTemplate.expireMinutes || 1) * 60 * 1000).toISOString(),
        addDate: new Date().toISOString(),
        merchantTransactionId: data.companyTransactionId
      };

      return {
        data: depositResponse,
        status: 200,
      };
    } catch (error) {
      return {
        error: 'Failed to create deposit',
        status: 500,
      };
    }
  },
  
  //cancels transaction
  cancelTransaction: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch('/test-data.json');
      const data = await response.json();
      
      return {
        data: data.cancelResponse,
        status: 200,
      };
    } catch (error) {
      return {
        error: 'Failed to cancel transaction',
        status: 500,
      };
    }
  },
}; 