import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { backend_url } from './exports';

const apiClient = axios.create({
    // baseURL:  '/api' // The proxy in vite.config.ts will handle this
    baseURL:`${backend_url}/api` 
    // baseURL:"http://localhost:3000/api" 
});

// This "interceptor" runs before every request
apiClient.interceptors.request.use(
    (config) => {
        // Get the token from our Zustand store
        const token = useAuthStore.getState().token;
        if (token) {
            // If the token exists, add it to the Authorization header
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);
apiClient.interceptors.response.use(
    (response)=> response,
    (error) => {
        // Check if the error is because of an expired token (401 status)
        if (error.response && error.response.status === 401) {
            const { logout } = useAuthStore.getState();
            // Don't show a toast for auth errors, just log out
            console.error("Authentication error: Token is invalid or expired.");
            logout();
            // Redirect to the login page
            // Using window.location.href is a reliable way to force a full page reload
            // which clears all state and is good practice after a logout.
            window.location.href = '/login';
        }
        
        // For all other errors, just pass them along
        return Promise.reject(error);
    }
)
export {apiClient}