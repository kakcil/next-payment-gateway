import { NextResponse } from 'next/server';
import { API_CONFIG, getApiHeaders } from '@/config/api';

async function getTransactionHandler(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    //gets transaction id from route params
    const transactionId = params.id;
    
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    //sends request to backend service with api key
    const apiUrl = `${API_CONFIG.BASE_URL}/api/v1/transaction/${transactionId}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: getApiHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || 'Failed to get transaction information' },
        { status: response.status }
      );
    }

    //gets response data and directly returns to client without modification
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error during transaction request:', error);
    
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export const GET = getTransactionHandler; 