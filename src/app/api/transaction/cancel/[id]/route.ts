import { NextResponse } from 'next/server';
import { API_CONFIG, getApiHeaders } from '@/config/api';

async function cancelHandler(
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
    const apiUrl = `${API_CONFIG.BASE_URL}/api/v1/transaction/updatestatus/${transactionId}`;
    
    //prepares request body with status 4 (cancel)
    const requestBody = { transactionStatus: 4 };
    
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: getApiHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || 'Failed to cancel transaction' },
        { status: response.status }
      );
    }

    const data = await response.text();
    
    //returns successful response to client
    return NextResponse.json({ message: data || 'Transaction cancelled' });
  } catch (error) {
    console.error('Error during cancel transaction request:', error);
    
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export const PATCH = cancelHandler; 