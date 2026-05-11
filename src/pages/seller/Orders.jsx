import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { Package, Truck, CheckCircle, Lock, Phone, ShieldCheck, Key, ChevronDown } from 'lucide-react'

const STATUS_HIERARCHY = [
    "Order Placed",     // Level 0
    "Packing",          // Level 1
    "Ready for Pickup", // Level 2
    "Out for Delivery", // Level 3 (Rider)
    "Delivered"         // Level 4 (Rider)
];

const SellerOrders = () => {
    const { axios, currency } = useAppContext()
    const [orders, setOrders] = useState([])
    
    const [openDropdownId, setOpenDropdownId] = useState(null);

    const fetchOrders = async () => {
        try {
            const { data } = await axios.get('/api/order/seller'); 
            if (data.success) {
                setOrders(data.orders);
            } else {
                toast.error(data.message);
            }
        } catch (error) { 
            toast.error("Error fetching orders");
        }
    }

    const statusHandler = async (orderId, status) => {
        if (!window.confirm(`Are you sure you want to mark this as "${status}"? You cannot undo this action.`)) {
            return fetchOrders(); 
        }

        try {
            const { data } = await axios.post('/api/order/status', { orderId, status });
            if (data.success) {
                toast.success(data.message);
                setOpenDropdownId(null); 
                fetchOrders(); 
            }
        } catch (error) { 
            toast.error("Update failed"); 
        }
    }

    useEffect(() => { 
        fetchOrders(); 
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [])

    return (
        <div className='space-y-5 font-outfit pb-20 relative'>
            
            {/* 🟢 FIX: Overlay z-index adjusted to 40 so it sits below the active card but above everything else */}
            {openDropdownId && (
                <div 
                    className="fixed inset-0 z-[40]" 
                    onClick={() => setOpenDropdownId(null)} 
                />
            )}

            <h2 className="text-2xl font-black text-gray-800">Manage Orders</h2>
            
            {orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-300">
                    <p className="text-gray-400 font-bold">No active orders found.</p>
                </div>
            ) : (
                orders.map((order) => {
                    const currentLevel = STATUS_HIERARCHY.indexOf(order.status);
                    const isLockedByRider = currentLevel >= 3;
                    const isDropdownOpen = openDropdownId === order._id;

                    const statusOptions = [
                        { label: 'Order Placed', value: 'Order Placed', level: 0 },
                        { label: 'Packing', value: 'Packing', level: 1 },
                        { label: 'Ready for Pickup ', value: 'Ready for Pickup', level: 2 },
                        { label: 'Out for Delivery (Rider)', value: 'Out for Delivery', level: 3, disabled: true },
                        { label: 'Delivered', value: 'Delivered', level: 4, disabled: true }
                    ];

                    return (
                        <div 
                            key={order._id} 
                            /* 🟢 FIX: Dynamic z-index. If this card's dropdown is open, boost it to z-50 so it overlays the cards below it */
                            className={`bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 justify-between hover:shadow-md transition-shadow relative ${isDropdownOpen ? 'z-[50]' : 'z-10'}`}
                        >
                            
                            {/* Order Details */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-2 bg-green-50 rounded-xl text-green-600"><Package size={20} /></div>
                                    <span className="font-black text-gray-800 text-lg">Order #{order._id.slice(-6).toUpperCase()}</span>
                                </div>
                                
                                <div className="space-y-2 mb-4 bg-gray-50 p-4 rounded-2xl">
                                    {order.items.map((item, index) => (
                                        <div key={index} className='text-sm text-gray-700 flex items-center gap-2'>
                                            <span className="font-black text-gray-900 bg-white px-2 py-1 rounded-lg shadow-sm">{item.quantity}x</span> 
                                            <span className="font-medium">{item.product.name}</span> 
                                            <span className='text-gray-400 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 border border-gray-200 rounded-md'>{item.size}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="text-sm border-t border-dashed border-gray-200 pt-3 mt-3">
                                    <p className='font-black text-gray-800'>{order.address.firstName} {order.address.lastName}</p>
                                    <p className='text-gray-500 font-medium'>{order.address.street}, {order.address.city}</p>
                                    <p className='text-gray-500 font-bold text-xs mt-1 flex items-center gap-1'><Phone size={12}/> {order.address.phone}</p>
                                </div>

                                {/* ALLOCATED RIDER CARD FOR THE SELLER */}
                                {order.riderId && (
                                    <div className="mt-4 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
                                        <div className="flex items-center gap-3">
                                            <img 
                                                src={order.riderId.profileImage || "https://cdn-icons-png.flaticon.com/512/4825/4825038.png"} 
                                                alt="Rider" 
                                                className="w-12 h-12 rounded-full border-2 border-emerald-200 object-cover shadow-sm"
                                            />
                                            <div>
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                                    <Truck size={10} /> Valet Assigned
                                                </p>
                                                <p className="font-black text-gray-800 text-lg leading-tight">{order.riderId.name}</p>
                                                <p className="text-xs text-gray-500 font-mono font-bold flex items-center gap-1">
                                                    <ShieldCheck size={12} className="text-emerald-500" /> {order.riderId.vehicleNumber || 'Verified Valet'}
                                                </p>
                                            </div>
                                        </div>
                                        {order.riderId.phone && (
                                            <a href={`tel:${order.riderId.phone}`} className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl font-bold text-sm shadow-sm border border-emerald-100 hover:bg-emerald-100 transition-colors">
                                                <Phone size={16} /> Call Delivery Partner
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Status Controls */}
                            <div className='flex flex-col gap-3 min-w-[240px] border-l border-gray-100 pl-0 md:pl-6'>
                                <div className="flex justify-between items-center bg-green-50 p-3 rounded-xl border border-green-100">
                                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Revenue</span>
                                    <span className='text-xl font-black text-green-700'>{currency}{order.amount}</span>
                                </div>

                                <label className="text-[10px] font-bold text-gray-400 uppercase mt-2 tracking-widest flex justify-between items-center">
                                    Order Status
                                    {isLockedByRider && <Lock size={12} className="text-gray-400" />}
                                </label>
                                
                                {/* PREMIUM CUSTOM DROPDOWN */}
                                <div className="relative w-full z-10">
                                    <button 
                                        type="button"
                                        onClick={() => !isLockedByRider && setOpenDropdownId(isDropdownOpen ? null : order._id)}
                                        disabled={isLockedByRider}
                                        className={`w-full flex items-center justify-between p-3 border rounded-xl font-bold text-sm outline-none transition-all
                                            ${isLockedByRider ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-800 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 shadow-sm'}
                                            ${isDropdownOpen ? 'border-green-500 ring-4 ring-green-500/10' : ''}
                                        `}
                                    >
                                        <span>
                                            {order.status === 'Ready for Pickup' ? 'Ready for Pickup ' : order.status}
                                        </span>
                                        {!isLockedByRider && (
                                            <ChevronDown size={16} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-green-600' : 'text-gray-400'}`} />
                                        )}
                                    </button>

                                    {/* Dropdown Menu - Boosted inner z-index */}
                                    {isDropdownOpen && !isLockedByRider && (
                                        <div className="absolute top-[110%] left-0 w-full bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up py-1 z-[60]">
                                            {statusOptions.map((option) => {
                                                const isOptionDisabled = option.disabled || currentLevel > option.level;
                                                const isSelected = order.status === option.value;

                                                return (
                                                    <button
                                                        key={option.value}
                                                        disabled={isOptionDisabled}
                                                        onClick={() => statusHandler(order._id, option.value)}
                                                        className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors
                                                            ${isOptionDisabled ? 'text-gray-300 bg-gray-50/50 cursor-not-allowed' : 'text-gray-700 hover:bg-green-50 hover:text-green-700'}
                                                            ${isSelected ? 'bg-green-50 text-green-700' : ''}
                                                        `}
                                                    >
                                                        {option.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Helpful Tips for Sellers */}
                                {order.status === 'Order Placed' && (
                                    <div className='text-[11px] text-orange-600 bg-orange-50 p-2.5 rounded-xl font-bold flex gap-2 items-center border border-orange-100'>
                                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                        Action: Change to "Packing"
                                    </div>
                                )}
                                 {order.status === 'Ready for Pickup' && !order.riderId && (
                                    <div className='text-[11px] text-blue-600 bg-blue-50 p-2.5 rounded-xl font-bold flex gap-2 items-center border border-blue-100'>
                                        <Truck size={14} className="animate-pulse" /> Scanning for Riders...
                                    </div>
                                )}

                                {/* SHOW PICKUP OTP TO SELLER */}
                                {order.status === 'Ready for Pickup' && order.riderId && (
                                    <div className='text-[11px] text-purple-600 bg-purple-50 p-2.5 rounded-xl font-bold flex justify-between items-center border border-purple-200 shadow-inner'>
                                        <span className="flex items-center gap-1"><Key size={14}/> Share OTP with Rider:</span>
                                        <span className="text-lg tracking-widest bg-white px-2 py-0.5 rounded border border-purple-100 shadow-sm">
                                            {order.pickupOtp || "1234"}
                                        </span>
                                    </div>
                                )}

                                {isLockedByRider && (
                                    <div className='text-[11px] text-emerald-600 bg-emerald-50 p-2.5 rounded-xl font-bold flex gap-2 items-center border border-emerald-100'>
                                        <CheckCircle size={14}/> Handled by Delivery Partner
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    )
}

export default SellerOrders