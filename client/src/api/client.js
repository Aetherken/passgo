import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://passgo-vfpt.onrender.com/api'),
    withCredentials: true,
});

export default api;
