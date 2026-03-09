import axios from 'axios';

const api = axios.create({
    baseURL: 'https://passgo-vfpt.onrender.com/api',
    withCredentials: true,
});

export default api;
