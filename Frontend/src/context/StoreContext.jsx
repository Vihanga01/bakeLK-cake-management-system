import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const StoreContext = createContext();

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
};

export const StoreProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingUser, setIsLoadingUser] = useState(false);

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        setToken(null);
        setCartItems([]);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
    };

    const api = useMemo(() => {
        const instance = axios.create({ baseURL: 'http://localhost:5000' });
        
        // Request interceptor to add token
        instance.interceptors.request.use((config) => {
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
        
        // Response interceptor to handle token expiration
        instance.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    
                    try {
                        console.log('Token expired, attempting to refresh...');
                        const refreshResponse = await axios.post('http://localhost:5000/api/auth/refresh');
                        
                        if (refreshResponse.data.success) {
                            const newToken = refreshResponse.data.accessToken;
                            setToken(newToken);
                            localStorage.setItem('accessToken', newToken);
                            
                            // Retry the original request with new token
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            return instance(originalRequest);
                        }
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                        // If refresh fails, logout user
                        logout();
                    }
                }
                
                return Promise.reject(error);
            }
        );
        
        return instance;
    }, [token]);

    // Bootstrap auth from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem('accessToken');
        const storedUserData = localStorage.getItem('userData');
        
        console.log('Bootstrap auth check:', { 
            hasStoredToken: !!storedToken, 
            hasStoredUserData: !!storedUserData,
            currentToken: !!token 
        });
        
        if (storedToken && !token) {
            console.log('Setting token and attempting to fetch user data...');
            setToken(storedToken);
            setIsAuthenticated(true);
            setIsLoadingUser(true);
            
            // First, try to use stored user data for immediate display
            if (storedUserData) {
                try {
                    const userData = JSON.parse(storedUserData);
                    setUser(userData);
                    console.log('Using stored user data:', userData);
                } catch (error) {
                    console.error('Failed to parse stored user data:', error);
                }
            }
            
            // Then fetch fresh user data from server
            api.get('/api/auth/me')
                .then((res) => {
                    console.log('Successfully fetched user data from server:', res.data);
                    if (res.data?.user) {
                        setUser(res.data.user);
                        localStorage.setItem('userData', JSON.stringify(res.data.user));
                    }
                    setIsLoadingUser(false);
                })
                .catch((error) => {
                    console.error('Failed to fetch user data from server:', error);
                    console.error('Error details:', {
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        data: error.response?.data,
                        message: error.message
                    });
                    // If token is invalid, clear everything
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('userData');
                    setToken(null);
                    setIsAuthenticated(false);
                    setUser(null);
                    setIsLoadingUser(false);
                });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cart API helpers
    const fetchCart = async () => {
        if (!isAuthenticated) return;
        const res = await api.get('/api/cart');
        const items = res.data?.items || res.data?.cart?.items || [];
        console.log('Fetched cart items:', items);
        setCartItems(items.map((i) => ({
            cake: i.cake?._id || i.cake,
            quantity: i.quantity,
            price: i.price,
            toppings: i.toppings || [],
            toppingsPrice: i.toppingsPrice || 0,
            totalPrice: i.totalPrice || (i.price * i.quantity),
            product: i.cake?._id ? i.cake : undefined,
            productName: i.cake?.productName || i.cake?.name,
            qty: i.cake?.qty,
            image: i.cake?.image
        })));
    };

    const addToCart = async (cakeId, quantity = 1, toppings = []) => {
        const res = await api.post('/api/cart/add', { cakeId, quantity, toppings });
        const items = res.data?.items || [];
        setCartItems(items.map((i) => ({
            cake: i.cake?._id || i.cake,
            quantity: i.quantity,
            price: i.price,
            toppings: i.toppings || [],
            toppingsPrice: i.toppingsPrice || 0,
            totalPrice: i.totalPrice || (i.price * i.quantity),
            product: i.cake?._id ? i.cake : undefined,
            productName: i.cake?.productName || i.cake?.name,
            qty: i.cake?.qty,
            image: i.cake?.image
        })));
    };

    const updateQuantity = async (cakeId, quantity) => {
        const res = await api.put('/api/cart/update', { cakeId, quantity });
        const items = res.data?.items || [];
        setCartItems(items.map((i) => ({
            cake: i.cake?._id || i.cake,
            quantity: i.quantity,
            price: i.price,
            toppings: i.toppings || [],
            toppingsPrice: i.toppingsPrice || 0,
            totalPrice: i.totalPrice || (i.price * i.quantity),
            product: i.cake?._id ? i.cake : undefined,
            productName: i.cake?.productName || i.cake?.name,
            qty: i.cake?.qty,
            image: i.cake?.image
        })));
    };

    const removeFromCart = async (cakeId) => {
        const res = await api.delete('/api/cart/remove', { data: { cakeId } });
        const items = res.data?.items || [];
        setCartItems(items.map((i) => ({
            cake: i.cake?._id || i.cake,
            quantity: i.quantity,
            price: i.price,
            toppings: i.toppings || [],
            toppingsPrice: i.toppingsPrice || 0,
            totalPrice: i.totalPrice || (i.price * i.quantity),
            product: i.cake?._id ? i.cake : undefined,
            productName: i.cake?.productName || i.cake?.name,
            qty: i.cake?.qty,
            image: i.cake?.image
        })));
    };

    const clearCart = async () => {
        // Optional: implement a clear endpoint in future; for now, remove each item
        setCartItems([]);
    };

    const login = (userData, accessToken) => {
        console.log('Login function called with:', { userData, accessToken: accessToken ? 'Token present' : 'No token' });
        setUser(userData);
        setToken(accessToken);
        setIsAuthenticated(true);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('userData', JSON.stringify(userData));
        console.log('Stored in localStorage:', {
            accessToken: localStorage.getItem('accessToken') ? 'Present' : 'Missing',
            userData: localStorage.getItem('userData') ? 'Present' : 'Missing'
        });
        fetchCart().catch(() => {});
    };

    const value = {
        cartItems,
        user,
        token,
        isAuthenticated,
        isLoadingUser,
        setToken,
        fetchCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        login,
        logout
    };

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
};

export { StoreContext };
