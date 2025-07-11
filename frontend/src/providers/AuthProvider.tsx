"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import authService from "@/lib/api/authService";
import { AuthState, LoginFormData, RegisterFormData } from "@/types/authType";

interface AuthContextType extends AuthState {
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  error: null,
};

// connecte user, redirige vers home et cree un context avec le token
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.me();
        if (user) {
          setState({
            user,
            isAuthenticated: true,
            error: null,
          });
        }
      } catch {
        // Si l'appel échoue, on reste déconnecté
        setState(initialState);
      }
    };

    checkAuth();
  }, []);

  // ? On utilise useCallback pour éviter de recréer les fonctions à chaque rendu

  /**
   * * * Fonction de connexion
   * @param data - Les données de connexion de l'utilisateur
   */
  const login = useCallback(
    async (data: LoginFormData) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const res = await authService.login(data);
        setState({
          user: res.user,
          error: null,
          isAuthenticated: true,
        });
        router.push("/");
        return { code: 200, user: res.user }; // retourne succès
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Échec de la connexion";
        setState((prev) => ({
          ...prev,
          error: message,
          isAuthenticated: false,
        }));
        return {
          code: error?.response?.status || 401,
          message,
        }; // retourne l'erreur
      }
    },
    [router]
  );

  /**
   * * Fonction d'inscription
   * @param data - Les données d'inscription de l'utilisateur
   */
  const register = useCallback(
    async (data: RegisterFormData) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        await authService.register(data);
        router.push("/login?registered=true");
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Échec de l'inscription",
          isAuthenticated: false,
        }));
      }
    },
    [router]
  );

  /**
   * * Fonction de déconnexion
   * @returns {void}
   * @description Déconnecte l'utilisateur et redirige vers la page d'accueil
   */
  const logout = useCallback(() => {
    authService.logout();
    setState(initialState);
    router.push("/");
  }, [router]);

  // Mémorisation des valeurs du contexte pour éviter lesre -rendus inutiles
  // ! a voir
  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
    }),
    [state, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personnalisé pour utiliser le contexte d'authentification
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth doit être utilisé à l'intérieur d'un AuthProvider"
    );
  }

  return context;
}
