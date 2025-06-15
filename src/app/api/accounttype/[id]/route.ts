import { NextResponse } from 'next/server';
import { API_CONFIG, getApiHeaders } from '@/config/api';

async function getAccountTypeHandler(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    //gets payment method id from params
    const paymentMethodId = params.id;
    
    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment Method ID is required' },
        { status: 400 }
      );
    }

    //sends request to backend service with api key
    const apiUrl = `${API_CONFIG.BASE_URL}/api/v1/accounttype/${paymentMethodId}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: getApiHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || 'Failed to get account type information' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    //returns successful response to client
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error during account types request:', error);
    
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export const GET = getAccountTypeHandler; 