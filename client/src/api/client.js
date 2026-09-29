import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://passgo-vfpt.onrender.com/api'),
    withCredentials: true,
});

// Intercept requests to attach Authorization header safely if available
api.interceptors.request.use((config) => {
    try {
        const userStr = localStorage.getItem('passgo_user') || localStorage.getItem('user');
        if (userStr && userStr !== 'undefined' && userStr !== 'null' && userStr !== '[object Object]') {
            let userId = null;
            try {
                const parsed = JSON.parse(userStr);
                if (parsed && parsed.id) userId = parsed.id;
            } catch (e) {
                if (!isNaN(userStr)) userId = parseInt(userStr, 10);
            }

            if (userId) {
                config.headers.Authorization = `Bearer ${userId}`;
                config.headers['X-User-Id'] = String(userId);
            }
        }
    } catch (e) {
        // Safe failover
    }
    return config;
});

export default api;
