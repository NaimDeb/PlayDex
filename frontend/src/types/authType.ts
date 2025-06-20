export interface User {
  id: number;
  email: string;
  roles: string[];
  username: string;
  createdAt: string; // renommé de created_at à createdAt
  reputation: number;
  isBanned?: boolean;
  banReason?: string;
  bannedUntil?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  username: string;
}

export interface BanUserData {
  banReason: string;
  bannedUntil?: string; // ISO date string, optional for permanent ban
}

export interface BanFormData {
  banReason: string;
  isPermanent: boolean;
  bannedUntil?: string;
}
