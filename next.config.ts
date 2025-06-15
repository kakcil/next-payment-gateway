/** @type {import('next').NextConfig} */
const config = {
  env: {
    // API Keys
    API_KEY: process.env.API_KEY || '',
    
    // API URLs
    API_BASE_URL: process.env.API_BASE_URL || '',
    NEXT_PUBLIC_ENV: process.env.NODE_ENV
  },
  reactStrictMode: true,
};

export default config;
