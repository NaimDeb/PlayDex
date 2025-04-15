export interface User {
    id: number;
    email: string;
    roles: string[];
    username: string;
    created_at: string;
    reputation: number;
}


export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    error: string | null;
}

export interface LoginFormData {
    email: string;
    password: string;
}

export interface RegisterFormData {
    email: string;
    password: string;
    username: string;
}
