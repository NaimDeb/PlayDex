import axios from "axios";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
    baseURL: baseUrl,
    headers: {
        'Content-Type': 'application/ld+json',
    }
})

export interface LoginResponse {
    token: string;
    user: {
      id: number;
      email: string;
    };
  }

export default apiClient;