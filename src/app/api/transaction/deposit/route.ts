import { NextResponse } from 'next/server';
import { API_CONFIG, getApiHeaders } from '@/config/api';

async function depositHandler(request: Request) {
  try {
    //gets data from client request
    const requestData = await request.json();
    
    //validates required fields
    if (!requestData.companyTransactionId || !requestData.accountTypeId) {
      return NextResponse.json(
        { error: 'companyTransactionId and accountTypeId fields are required' },
        { status: 400 }
      );
    }

    //sends request to backend service with api key
    const apiUrl = `${API_CONFIG.BASE_URL}/api/v1/transaction/deposit`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: errorData || 'Deposit operation failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    //returns successful response to client
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error during deposit request:', error);
    
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export const POST = depositHandler; 