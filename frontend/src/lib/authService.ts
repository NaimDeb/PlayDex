import apiClient from "./apiClient";
import { LoginFormData, RegisterFormData, User } from "@/types/authType";




class AuthService {

    // Todo : implement remember me here ?
    /**
     * Logs in a user, stores the token in the cookie and retrieves the data.
     * @param givenData - The login data for the user
     * @returns - An object containing the user and token
     */
    public async login(givenData: LoginFormData): Promise<{ user: User; token: string }> {

      // Login check API Call
      const { data } = await apiClient.post(`/login_check`, {
        email: givenData.email,
        password: givenData.password,
      });

      const token = data.token;
      

      // Store the token in a cookie
      // Todo : check if it really works, if the max Age isn't configured in the API instead.
      const maxAge = data.rememberMe ? 30 * 24 * 60 * 60 : 3600; // 30 days or 1 hour
      // Todo : add secure in prod
      document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; samesite=strict`;

      // ME API Call for getting user data
      
      const user = await this.me();
      return { user: user, token: token };
    }


    
    /**
     * Registers a new user
     * @param givenData - The registration data for the user
     * @returns - An ok response or an error
     */
    public async register(givenData: RegisterFormData): Promise<void> {
      await apiClient.post(`/register`, {
        email: givenData.email,
        password: givenData.password,
        username: givenData.username,
      });
      return;
    }


    /**
     * Logs out the user and removes the token from the cookie
     * 
     */
    public async logout() {
      if (!document.cookie) {
        return { message: "You aren't logged in" };
      }
      // Remove the token from the cookie
      document.cookie = `auth_token=; path=/; max-age=0;`;
      // Redirects to home page
      window.location.href = "/";
      // Todo : check if the redirection works, or if we need to use router.push("/")
      return { message: "Successfully logged out" };


    }


    private async me(): Promise<User> {
      // Get the token from the cookie
      // Todo : check if works
      const token = document.cookie.split("; ").find(row => row.startsWith("auth_token="))?.split("=")[1];

      if (!token) {
        throw new Error("No token found in cookie");
      }

      const { data: userData } = await apiClient.get(`/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return userData;
    }


    }
    
    const authService = new AuthService();
    export default authService;

