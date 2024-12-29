import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000', // Make sure this matches your backend's URL and port
});

export const getProducts = () => api.get('/products');
export const getOrders = () => api.get('/orders');
export const addProduct = (productData, token) =>
    api.post('/products', productData, {
        headers: { Authorization: `Bearer ${token}` },
    });

export default api;
