import axios from "axios";
import http from "http";
import https from "https";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/ld+json",
  },
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
});

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
  };
}

export default apiClient;