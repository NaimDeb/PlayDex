class AuthUtils {

    getAuthorization() {
        const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
        if (!token) {
            throw new Error('No token found in cookies, try to log in first');
        }

        const config = { headers: { "Authorization": `Bearer ${token}` } }

        return config;
    }

}

const authUtils = new AuthUtils();
export default authUtils;