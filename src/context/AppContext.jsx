import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { useUser, useClerk } from "@clerk/clerk-react"; 
import { io } from "socket.io-client";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const currency = "₹";
    const navigate = useNavigate();
    // const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://mandvicart-backend.onrender.com";
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const { isSignedIn, user: clerkUser, isLoaded: clerkLoaded } = useUser();
    const { signOut: clerkSignOut } = useClerk();

    const [token, setToken] = useState(() => localStorage.getItem('token') || false);
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(() => localStorage.getItem('role') || 'user');
    const [systemSettings, setSystemSettings] = useState({ deliveryFee: 40, freeDeliveryThreshold: 400 });
    
    const [products, setProducts] = useState([]);
    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem('guestCart');
        return saved ? JSON.parse(saved) : {};
    });

    const [isLoading, setIsLoading] = useState(true); 
    const [showUserLogin, setShowUserLogin] = useState(false);
    const [search, setSearch] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);
    
    // 🟢 NEW: State to trigger the global Lottie cart animation
    const [isCartAnimating, setIsCartAnimating] = useState(false);

    // 🟢 LOCKS
    const isLoggingOut = useRef(false);
    const hasSynced = useRef(false);

    // ==========================================
    // 🛑 THE NUCLEAR LOGOUT
    // ==========================================
    const forceLogout = async () => {
        if (isLoggingOut.current) return; 
        isLoggingOut.current = true;
        
        console.log("🛑 Wiping entire session...");
        localStorage.removeItem('token'); 
        localStorage.removeItem('role');
        localStorage.removeItem('guestCart');

        setToken(false); 
        setUser(null); 
        setRole('user'); 
        setCartItems({});
        setIsMapOpen(false); 

        try { await clerkSignOut(); } catch (error) { console.error("Clerk SignOut Error:", error); }
        navigate('/home');

        setTimeout(() => { 
            isLoggingOut.current = false;
            hasSynced.current = false; 
        }, 2000);
    };

    const logout = async () => {
        try { await api.post('/api/user/logout'); } catch (e) { console.error("Backend Logout Error:", e); }
        toast.success("Logged out successfully");
        await forceLogout();
    };

    useEffect(() => {
        if (clerkLoaded && !isSignedIn && token && !isLoggingOut.current) {
            forceLogout();
        }
    }, [clerkLoaded, isSignedIn, token]);

    // ==========================================
    // 🛡️ API INSTANCE & INTERCEPTORS
    // ==========================================
    const api = useMemo(() => {
        const instance = axios.create({ baseURL: backendUrl, withCredentials: true });
        
        instance.interceptors.request.use(
            (config) => {
                const currentToken = localStorage.getItem('token'); 
                if (currentToken) {
                    config.headers.Authorization = `Bearer ${currentToken}`;
                    config.headers.token = currentToken; 
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        instance.interceptors.response.use(
            (response) => response,
            (error) => {
                const isAuthCheck = error.config?.url?.includes('/api/user/is-auth');
                if (error.response && error.response.status === 401) {
                    if (!isAuthCheck) toast.error("Session expired. Please log in again.");
                    forceLogout(); 
                }
                return Promise.reject(error);
            }
        );

        return instance;
    }, [backendUrl]);

    // ==========================================
    // 🚀 BULLETPROOF CLERK SYNC 
    // ==========================================
    useEffect(() => {
        const syncClerkWithBackend = async () => {
            if (clerkLoaded && isSignedIn && clerkUser && !token && !isLoggingOut.current && !hasSynced.current) {
                hasSynced.current = true; 

                try {
                    const { data } = await api.post('/api/user/clerk-login', { clerkId: clerkUser.id });

                    if (data.success) {
                        setShowUserLogin(false); 
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('role', data.role);
                        setToken(data.token);
                        setRole(data.role);
                        setUser(data.user);
                        
                        toast.success(`Welcome back, ${data.user.name || data.role}!`);
                        
                        // Navigate based on role!
                        if (data.role === 'superadmin') navigate('/superadmin/dashboard');
                        else if (data.role === 'admin') navigate('/admin/dashboard');
                        else if (data.role === 'seller') navigate('/seller/dashboard');
                        else if (data.role === 'rider') navigate('/rider/dashboard');
                    } else {
                        console.warn("Clerk Sync Failed:", data.message);
                        setTimeout(() => { hasSynced.current = false; }, 5000); 
                    }
                } catch (error) {
                    console.error("Clerk Sync Network Error:", error);
                    setTimeout(() => { hasSynced.current = false; }, 5000);
                }
            }
        };

        syncClerkWithBackend();
    }, [clerkLoaded, isSignedIn, clerkUser?.id, token, api, navigate]); 

    const fetchProducts = useCallback(async () => {
        try {
            const { data } = await api.get('/api/product/list');
            if (data.success) setProducts(data.products);
        } catch (error) { console.error("Failed to fetch products:", error); }
    }, [api]);

    const fetchSettings = useCallback(async () => {
        try {
            // Note: Settings route expects '/api/settings'
            const { data } = await api.get('/api/settings');
            if (data.success && data.settings) {
                setSystemSettings(data.settings);
            }
        } catch (error) { console.error("Failed to fetch settings:", error); }
    }, [api]);

    const fetchUserProfile = useCallback(async () => {
        try {
            const storedToken = localStorage.getItem('token');
            if (!storedToken) { setIsLoading(false); return; }

            const { data } = await api.get('/api/user/is-auth'); 
            
            if (data.success) {
                const fullUser = { ...data.user, role: data.role || data.user.role || 'user' };
                setUser(fullUser);
                setRole(fullUser.role);
                localStorage.setItem('role', fullUser.role);

                if (fullUser.role === 'user' && data.user.cartItems) {
                    setCartItems(data.user.cartItems);
                    localStorage.removeItem('guestCart'); 
                }
            } else {
                forceLogout(); 
            }
        } catch (error) {
            console.error("Fetch Profile Error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [api]);

    // ==========================================
    // 🛒 CART OPERATIONS
    // ==========================================
    const addToCart = async (itemId, size) => {
        if (!size) return toast.error("Please select a product size.");
        if (['admin', 'superadmin', 'rider', 'seller'].includes(role)) return toast.error("Staff accounts cannot place orders.");

        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            if (cartData[itemId][size]) cartData[itemId][size] += 1;
            else cartData[itemId][size] = 1;
        } else { cartData[itemId] = {}; cartData[itemId][size] = 1; }
        
        setCartItems(cartData);
        
        // 🟢 NEW: Trigger the global Lottie animation instead of a plain toast
        setIsCartAnimating(true);
        setTimeout(() => {
            setIsCartAnimating(false);
        }, 1500); // Hides the animation after 1.5s

        if (token) {
            try { await api.post('/api/cart/add', { itemId, size }); } catch (error) { console.error("Cart Add Error:", error); }
        } else {
            localStorage.setItem('guestCart', JSON.stringify(cartData));
        }
    };

    const updateQuantity = async (itemId, size, quantity) => {
        let cartData = structuredClone(cartItems);
        cartData[itemId][size] = quantity;
        setCartItems(cartData);

        if (token) {
            try { await api.post('/api/cart/update', { itemId, size, quantity }); } catch (error) { console.error("Cart Update Error:", error); }
        } else {
            localStorage.setItem('guestCart', JSON.stringify(cartData));
        }
    };

    const getCartCount = () => {
        let totalCount = 0;
        for (const productId in cartItems) {
            for (const size in cartItems[productId]) {
                if (cartItems[productId][size] > 0) totalCount += cartItems[productId][size];
            }
        }
        return totalCount;
    };

    const getCartAmount = () => {
        let totalAmount = 0;
        if (!products || products.length === 0) return 0;
        
        for (const productId in cartItems) {
            let itemInfo = products.find((product) => product._id === productId);
            if (itemInfo) {
                for (const size in cartItems[productId]) {
                    if (cartItems[productId][size] > 0) {
                        const variant = itemInfo.variants?.find(v => v.weight === size);
                        const price = Number(variant ? (variant.offerPrice || variant.price) : (itemInfo.offerPrice || itemInfo.price)) || 0; 
                        totalAmount += price * cartItems[productId][size];
                    }
                }
            }
        }
        return isNaN(totalAmount) ? 0 : Math.floor(totalAmount * 100) / 100;
    };

    // ==========================================
    // 🔄 LIFECYCLE EFFECTS
    // ==========================================
    useEffect(() => { fetchProducts(); fetchSettings(); }, [fetchProducts, fetchSettings]);

    useEffect(() => {
        if (token && !user) {
            fetchUserProfile();
        } else if (!token && clerkLoaded) { 
            setUser(null); 
            setIsLoading(false); 
        } else if (user) {
            setIsLoading(false);
        }
    }, [token, user, fetchUserProfile, clerkLoaded]);

    // 🟢 NEW: Global Socket Notification Engine
    useEffect(() => {
        let globalSocket;
        if (user && user._id) {
            globalSocket = io(backendUrl);
            globalSocket.emit("register_user", user._id);

            globalSocket.on("push_notification", (message) => {
                // Play heavy-duty global notification toast!
                toast.success(message, {
                    duration: 8000,
                    icon: '🔔',
                    style: { background: '#10b981', color: '#fff', fontWeight: 'bold' }
                });
            });
        }
        return () => {
            if (globalSocket) globalSocket.disconnect();
        };
    }, [user, backendUrl]);

    const value = {
        navigate, currency, backendUrl, isLoading,
        token, setToken, user, setUser, role, setRole,
        showUserLogin, setShowUserLogin, logout,
        fetchUserProfile,
        products, fetchProducts, 
        systemSettings, fetchSettings,
        search, setSearch, showSearch, setShowSearch,
        cartItems, setCartItems, 
        addToCart, updateQuantity, getCartCount, getCartAmount, 
        axios: api,
        isMapOpen, setIsMapOpen,
        isCartAnimating // 🟢 NEW: Export the animation state so GlobalCartAnimation can read it
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => { return useContext(AppContext); };