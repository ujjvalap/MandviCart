import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { MapPin, Edit2, Plus, Minus, ShoppingBag, Receipt, Check, CreditCard, Banknote, AlertCircle, TrendingUp, User, Truck, Zap, Headset, Phone } from 'lucide-react';
import MockPaymentModal from "../components/MockPaymentModal";

// 🟢 1. Import Lottie and your JSON file
import Lottie from "lottie-react";
import emptyCartAnimation from "../assets/empty.json"; 

const MIN_ORDER_AMOUNT = 100;
const MAX_ORDER_AMOUNT = 10000;

const Cart = () => {
    const { systemSettings, products, currency, cartItems, getCartCount, updateQuantity, getCartAmount, axios, user, setCartItems, token, addToCart, setShowUserLogin } = useAppContext();
    const navigate = useNavigate();
    
    const [cartArray, setCartArray] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cod'); 
    
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const hasToken = localStorage.getItem('token');
        if (!hasToken && !user) {
            toast.error("Please log in to access your cart.", { icon: '🔒' });
            if (setShowUserLogin) setShowUserLogin(true); 
            navigate('/'); 
        }
    }, [user, navigate, setShowUserLogin]);

    useEffect(() => {
        if (products.length > 0 && cartItems) {
            let tempArray = [];
            for (const productId in cartItems) {
                const product = products.find((item) => item._id === productId);
                if (product) {
                    const sizes = cartItems[productId];
                    for (const size in sizes) {
                        if (sizes[size] > 0) tempArray.push({ ...product, quantity: sizes[size], size: size });
                    }
                }
            }
            setCartArray(tempArray);
        }
    }, [products, cartItems]);

    useEffect(() => {
        if (user) {
            const fetchAddress = async () => {
                try {
                    const { data } = await axios.get('/api/address/get', { headers: { Authorization: `Bearer ${token}` } });
                    if (data.success && data.addresses.length > 0) {
                        setAddresses(data.addresses);
                        setSelectedAddress(data.addresses[0]); 
                    }
                } catch (error) { console.error("Error fetching addresses", error); }
            };
            fetchAddress();
        } else {
            setAddresses([]);
            setSelectedAddress(null);
        }
    }, [user, axios, token]);

    const rawSubtotal = getCartAmount();
    const subtotal = Number(rawSubtotal) || 0;
    
    const deliveryCharge = (subtotal > 0 && subtotal < systemSettings.freeDeliveryThreshold) ? systemSettings.deliveryFee : 0;
    
    const totalAmount = subtotal + deliveryCharge;
    const amountShort = MIN_ORDER_AMOUNT - totalAmount;

    useEffect(() => {
        if (totalAmount > 1000 && paymentMethod === 'cod') {
            setPaymentMethod('online');
        }
    }, [totalAmount]);

    // 🟢 FIX 1: Explicitly lock in the variant price so the backend gets the correct info!
    const getOrderData = () => {
        const orderItems = cartArray.map(item => {
            const productData = structuredClone(item);
            if (!productData.sellerId) productData.sellerId = "admin"; 

            // Find the specific size the user selected
            const selectedVariant = productData.variants?.find(v => v.weight === item.size);
            
            // If it's a variant, OVERRIDE the main product price so the database records the 1kg/500g price correctly
            if (selectedVariant) {
                productData.price = selectedVariant.price;
                productData.offerPrice = selectedVariant.offerPrice;
            }

            return { 
                _id: item._id, 
                itemId: item._id, 
                product: productData, 
                quantity: item.quantity, 
                size: item.size,
                price: productData.offerPrice // Extra safety to pass exact price
            };
        });
        return { items: orderItems, amount: totalAmount, address: selectedAddress };
    };

    const handlePlaceOrderClick = () => {
        if (!user) {
            if (setShowUserLogin) setShowUserLogin(true);
            return toast.error("Please log in to proceed to checkout");
        }

        if (!selectedAddress) return toast.error("Please select an address");
        if (getCartCount() === 0) return toast.error("Cart is empty");
        if (totalAmount <= 0 || isNaN(totalAmount)) return toast.error("Invalid total amount. Please refresh.");

        if (totalAmount < MIN_ORDER_AMOUNT) {
            return toast.error(`Add items worth ${currency}${amountShort} more to place order!`);
        }
        if (totalAmount > MAX_ORDER_AMOUNT) {
            return toast.error(`Order total cannot exceed ${currency}${MAX_ORDER_AMOUNT.toLocaleString()}`);
        }

        if (totalAmount > 1000 && paymentMethod === 'cod') {
            return toast.error(`Orders above ${currency}1,000 require Online Payment`);
        }

        if (paymentMethod === 'online') {
            setShowPaymentModal(true);
        } else {
            processOrder('COD'); 
        }
    };

    const processOrder = async (method) => {
        try {
            setIsProcessing(true); 
            
            const orderData = getOrderData();
            let response;

            if (method === 'online') {
                response = await axios.post('/api/order/mock', orderData, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                response = await axios.post('/api/order/place', orderData, { headers: { Authorization: `Bearer ${token}` } });
            }

            if (response.data.success) {
                toast.success(response.data.message);
                setCartItems({}); 
                navigate('/my-orders');
                setIsProcessing(false);
            } else {
                setIsProcessing(false);
                toast.error(response.data.message);
            }
        } catch (error) { 
            setIsProcessing(false);
            console.error(error);
            toast.error(error.message); 
        }
    };

    const getSuggestions = () => {
        return products
            .filter(p => !cartItems[p._id]) 
            .slice(0, 4); 
    };

    if (!user && !localStorage.getItem('token')) return null;

    if (getCartCount() === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] mt-10 text-gray-500 gap-2">
                <div className="w-64 h-64 md:w-80 md:h-90 -mb-8">
                    <Lottie animationData={emptyCartAnimation} loop={true} />
                </div>
                <p className="text-3xl font-bold text-gray-800">Your cart is empty!</p>
                <p className="text-gray-500 text-sm mb-4">Looks like you haven't added anything yet.</p>
                <button 
                    // 🟢 FIX 2: Seamlessly navigate to the shop page without refreshing
                    onClick={() => {
                        navigate('/products');
                        window.scrollTo(0, 0);
                    }}
                    className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 hover:-translate-y-0.5 transition-all"
                >
                    Start Shopping
                </button>
            </div>
        );
    }

    const isCodDisabled = totalAmount > 1000;

    return (
        <div className="flex flex-col md:flex-row mt-16 gap-8 pb-16 px-4 md:px-16 font-outfit relative max-w-7xl mx-auto">
            
            {showPaymentModal && (
                <MockPaymentModal 
                    amount={totalAmount}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={() => {
                        setShowPaymentModal(false);
                        processOrder('online'); 
                    }}
                />
            )}

            {/* LEFT SIDE: Items & Address */}
            <div className='flex-1'>
                <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><ShoppingBag /> Shopping Cart</h1>
                
                {cartArray.map((product, index) => {
                    const price = product.variants?.find(v => v.weight === product.size)?.offerPrice || product.offerPrice;
                    return (
                        <div key={index} className="flex gap-4 border-b border-gray-200 py-6 items-start">
                            <img className="w-20 h-20 object-contain bg-gray-50 rounded-xl p-2" src={product.image[0]} alt="" />
                            <div className="flex-1">
                                <p className="font-bold text-lg text-gray-800">{product.name}</p>
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2"><span className="bg-gray-100 px-2 rounded text-xs">{product.size}</span> {currency}{price} x {product.quantity}</p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <p className="font-bold text-lg">{currency}{price * product.quantity}</p>
                                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                    <button onClick={() => updateQuantity(product._id, product.size, product.quantity - 1)} className="w-7 h-7 bg-white shadow-sm rounded flex items-center justify-center text-gray-600 hover:text-black"><Minus size={14}/></button>
                                    <span className="font-medium text-sm w-4 text-center">{product.quantity}</span>
                                    <button onClick={() => updateQuantity(product._id, product.size, product.quantity + 1)} className="w-7 h-7 bg-white shadow-sm rounded flex items-center justify-center text-gray-600 hover:text-black"><Plus size={14}/></button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Address Selection */}
                <div className="mt-10">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><MapPin className="text-green-600"/> Delivery Address</h2>
                    
                    <div className="grid grid-cols-1 gap-4">
                        {addresses.map((addr, index) => (
                            <div key={index} onClick={() => setSelectedAddress(addr)} className={`p-5 border rounded-2xl cursor-pointer relative transition-all duration-200 ${selectedAddress?._id === addr._id ? 'border-green-500 bg-green-50/50 ring-2 ring-green-100' : 'border-gray-200 hover:border-gray-300'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-800">{addr.firstName} {addr.lastName}</p>
                                        <p className="text-sm text-gray-600 mt-1">{addr.street}, {addr.city}, {addr.zipcode}</p>
                                        {/* 🟢 FIX 3: Clean professional Phone Icon */}
                                        <p className="text-xs text-gray-500 mt-2 font-medium flex items-center gap-1">
                                            <Phone size={12} className="text-gray-400" /> {addr.phone}
                                        </p>
                                    </div>
                                    {selectedAddress?._id === addr._id && <div className="bg-green-500 text-white rounded-full p-1"><Check size={14} /></div>}
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); navigate('/add-address', { state: { addressToEdit: addr } }); }} className="absolute bottom-4 right-4 text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                    <Edit2 size={12} /> Edit
                                </button>
                            </div>
                        ))}
                        <button onClick={() => navigate('/add-address')} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-all font-medium flex items-center justify-center gap-2">
                            <Plus size={18} /> Add New Address
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: Order Summary */}
            <div className="w-full md:w-[380px]">
                
                {/* UPSELL SUGGESTIONS */}
                {totalAmount < MIN_ORDER_AMOUNT && (
                    <div className="bg-orange-50 border border-orange-200 rounded-3xl p-5 mb-6 animate-fade-in">
                        <div className="flex items-start gap-3 text-orange-700 mb-3">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-sm">Almost there!</p>
                                <p className="text-xs font-medium opacity-90">Add {currency}{amountShort} more to reach the {currency}{MIN_ORDER_AMOUNT} minimum order value.</p>
                            </div>
                        </div>
                        
                        <p className="text-xs font-bold text-orange-800/60 uppercase tracking-widest mb-3 flex items-center gap-1"><TrendingUp size={12}/> Suggested Add-ons</p>
                        
                        <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
                            {getSuggestions().map(product => {
                                const price = product.variants?.[0]?.offerPrice || product.offerPrice;
                                const defaultSize = product.sizes?.[0] || product.variants?.[0]?.weight || "Standard";
                                
                                return (
                                    <div key={product._id} className="min-w-[110px] bg-white p-3 rounded-2xl border border-orange-100 flex flex-col items-center text-center shadow-sm snap-start shrink-0">
                                        <img src={product.image[0]} className="w-12 h-12 object-contain mb-2 mix-blend-multiply" alt={product.name}/>
                                        <p className="text-[10px] font-bold text-gray-800 line-clamp-1 w-full">{product.name}</p>
                                        <p className="text-xs font-black text-green-600 my-1">{currency}{price}</p>
                                        <button
                                            onClick={async () => {
                                                if (addToCart) {
                                                    await addToCart(product._id, defaultSize);
                                                } else {
                                                    updateQuantity(product._id, defaultSize, 1);
                                                }
                                            }}
                                            className="mt-auto w-full py-1.5 bg-orange-100 text-orange-700 text-[10px] font-black tracking-wide rounded-lg hover:bg-orange-200 transition-colors active:scale-95"
                                        >
                                            + ADD
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                <div className="bg-[#fbfcff] p-7 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-blue-100/50 sticky top-24">
                    <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-slate-800"><ShoppingBag className="text-emerald-500" strokeWidth={2.5}/> Order Summary</h2>
                    <div className="space-y-4 text-sm font-medium text-slate-500 mb-6">
                        <div className="flex justify-between items-center"><span>Merchandise Subtotal</span><span className="font-bold text-slate-800">{currency}{subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center">
                            <span>Delivery Partner Fee</span>
                            <span className={`font-bold ${deliveryCharge === 0 ? "text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md" : "text-slate-800"}`}>
                                {deliveryCharge === 0 ? 'FREE' : `${currency}${deliveryCharge.toFixed(2)}`}
                            </span>
                        </div>
                        
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent my-5"></div>
                        
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="text-xl font-black text-slate-900 block">Grand Total</span>
                                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Includes all taxes</span>
                            </div>
                            <span className="text-3xl font-black text-emerald-600 tracking-tight">{currency}{totalAmount.toFixed(2)}</span>
                        </div>
                        
                        {totalAmount > MAX_ORDER_AMOUNT && <p className="text-red-500 text-xs font-bold mt-3 text-center bg-red-50 p-2.5 rounded-xl border border-red-100">Maximum order limit is {currency}10,000</p>}
                    </div>

                    <div className="mb-6">
                        <p className="text-sm font-bold text-gray-800 mb-3">Payment Method</p>
                        <div className="space-y-3">
                            
                            <div 
                                onClick={() => !isCodDisabled && setPaymentMethod('cod')} 
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isCodDisabled ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' : paymentMethod === 'cod' ? 'border-green-500 bg-green-50 cursor-pointer' : 'border-gray-200 hover:border-gray-300 cursor-pointer'}`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-green-500' : 'border-gray-400'}`}>
                                    {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>}
                                </div>
                                <Banknote size={20} className={isCodDisabled ? "text-gray-400" : "text-green-600"}/>
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-700">Cash on Delivery</span>
                                    {isCodDisabled && <span className="text-[10px] font-bold text-red-500 flex items-center gap-1"><AlertCircle size={10}/> Unavailable above {currency}1000</span>}
                                </div>
                            </div>

                            <div onClick={() => setPaymentMethod('online')} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-blue-500' : 'border-gray-400'}`}>
                                    {paymentMethod === 'online' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                                </div>
                                <CreditCard size={20} className="text-blue-600"/>
                                <span className="font-medium text-gray-700">Online Payment (UPI/Card)</span>
                            </div>

                        </div>
                    </div>

                    <button 
                        onClick={handlePlaceOrderClick} 
                        disabled={isProcessing || (user && (totalAmount < MIN_ORDER_AMOUNT || totalAmount > MAX_ORDER_AMOUNT))}
                        className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed ${paymentMethod === 'online' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
                    >
                        {isProcessing ? "PROCESSING..." : (totalAmount < MIN_ORDER_AMOUNT ? `ADD ${currency}${amountShort} MORE` : (paymentMethod === 'online' ? 'PAY NOW' : 'PLACE ORDER'))}
                    </button>

                    <div className="grid grid-cols-3 gap-2 mt-6">
                        <div className="flex flex-col items-center justify-center text-center p-3 border border-slate-100 rounded-xl bg-gray-50/80">
                            <Truck className="text-emerald-500 mb-1.5" size={18} />
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Free Delivery<br/>Above {currency}{systemSettings.freeDeliveryThreshold}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center p-3 border border-slate-100 rounded-xl bg-gray-50/80">
                            <Zap className="text-emerald-500 mb-1.5" size={18} />
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Fast Delivery<br/>To Door</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center p-3 border border-slate-100 rounded-xl bg-gray-50/80">
                            <Headset className="text-emerald-500 mb-1.5" size={18} />
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Item Broken?<br/>Contact Us</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Cart;