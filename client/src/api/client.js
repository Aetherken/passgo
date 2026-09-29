import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://passgo-vfpt.onrender.com/api'),
    withCredentials: true,
});

// Intercept requests to attach Authorization header if available
api.interceptors.request.use((config) => {
    const userStr = localStorage.getItem('passgo_user') || localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user && user.id) {
                config.headers.Authorization = `Bearer ${user.id}`;
                config.headers['X-User-Id'] = String(user.id);
            }
        } catch (e) {
            // If stored string is directly a user ID or token
            if (userStr && userStr !== 'undefined') {
                config.headers.Authorization = `Bearer ${userStr}`;
                config.headers['X-User-Id'] = String(userStr);
            }
        }
    }
    return config;
});

export default api;
