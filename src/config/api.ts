export const API_CONFIG = {
  API_KEY: process.env.API_KEY || '',
  BASE_URL: process.env.API_BASE_URL || '',
};

//creates common headers for api requests
export const getApiHeaders = () => {
  return {
    'x-api-key': API_CONFIG.API_KEY,
    'Content-Type': 'application/json'
  };
};

 