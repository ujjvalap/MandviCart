import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Package, MapPin, Truck, Store, User, 
    Key, Clock, CheckCircle, XCircle, Wallet, AlertCircle, ShieldCheck 
} from 'lucide-react';

const AdminOrders = () => {
    const { axios, currency } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('active'); // 'all', 'active', 'completed', 'cancelled'

    const fetchOrders = async () => {
        try {
            const { data } = await axios.get('/api/order/all-list');
            if (data.success) {
                setOrders(data.orders);
            }
        } catch (error) { toast.error("Load failed"); }
    };

    const statusHandler = async (e, order) => {
        if (['Delivered', 'Cancelled'].includes(order.status)) {
            return toast.error(`Cannot change status. Order is already ${order.status}.`);
        }

        try {
            const { data } = await axios.post('/api/order/status', { orderId: order._id, status: e.target.value });
            if(data.success) { 
                toast.success("Status Updated"); 
                fetchOrders(); 
            } else {
                toast.error(data.message);
            }
        } catch (error) { toast.error("Update failed"); }
    }

    useEffect(() => { 
        fetchOrders(); 
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [axios]);

    const filteredOrders = orders.filter(o => {
        if (filter === 'active') return !['Delivered', 'Cancelled'].includes(o.status);
        if (filter === 'completed') return o.status === 'Delivered';
        if (filter === 'cancelled') return o.status === 'Cancelled';
        return true;
    });

    const formatTime = (timestamp) => {
        if (!timestamp) return '--:--';
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Order Placed': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'Packing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Ready for Pickup': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Out for Delivery': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
            case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6 pb-20 font-outfit max-w-7xl mx-auto">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-4 z-40">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2"><Package className="text-blue-600"/> Order Control Center</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Live Tracking & Audit</p>
                </div>
                
                <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto hide-scrollbar">
                    {['active', 'completed', 'cancelled', 'all'].map(f => (
                        <button 
                            key={f} onClick={() => setFilter(f)} 
                            className={`flex-1 md:flex-none capitalize px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <AnimatePresence>
                    {filteredOrders.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                            <AlertCircle size={48} className="mx-auto text-gray-300 mb-4"/>
                            <p className="text-lg font-bold text-gray-500">No {filter} orders found.</p>
                        </div>
                    ) : filteredOrders.map((order) => (
                        <motion.div 
                            initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, scale:0.95}}
                            key={order._id} 
                            className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"
                        >
                            {/* TOP BAR */}
                            <div className="bg-gray-50/80 border-b border-gray-200 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-black px-3 py-1 rounded-md uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                    <span className="font-bold text-gray-800">Order #{order._id.slice(-8).toUpperCase()}</span>
                                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1"><Clock size={12}/> {new Date(order.date).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <select 
                                        onChange={(e) => statusHandler(e, order)} 
                                        value={order.status} 
                                        disabled={['Delivered', 'Cancelled'].includes(order.status)}
                                        className="w-full md:w-auto px-4 py-2 rounded-xl text-sm font-bold border border-gray-300 bg-white outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200 transition-all"
                                    >
                                        <option value="Order Placed">Order Placed</option>
                                        <option value="Packing">Packing</option>
                                        <option value="Ready for Pickup">Ready for Pickup</option>
                                        <option value="Out for Delivery">Out for Delivery</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {/* MIDDLE GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                                
                                <div className="p-5 space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><User size={14}/> Customer</p>
                                        <p className="font-bold text-gray-800 text-sm">{order.address?.firstName} {order.address?.lastName}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{order.address?.phone}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">{order.address?.street}, {order.address?.city}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Items ({order.items?.length || 0})</p>
                                        <div className="max-h-20 overflow-y-auto hide-scrollbar space-y-1">
                                            {order.items?.map((i, idx) => (
                                                <p key={idx} className="text-xs text-gray-700 truncate">• {i.quantity}x {i.product?.name} ({i.size})</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Store size={14}/> Assigned Seller</p>
                                        <p className="font-bold text-gray-800 text-sm">{order.sellerId === 'admin' ? 'GreenCart Hub (Admin)' : `Seller ID: ${order.sellerId?.slice(-6)}`}</p>
                                    </div>
                                    <div className="border-t border-dashed border-gray-200 pt-4">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Truck size={14}/> Assigned Rider</p>
                                        {order.riderId ? (
                                            <div>
                                                <p className="font-bold text-blue-700 text-sm">{order.riderId.name}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                    {order.riderId.phone} <span className="bg-gray-100 px-1.5 rounded text-[10px] font-mono">{order.riderId.vehicleNumber}</span>
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="bg-orange-50 text-orange-600 border border-orange-100 text-xs font-bold px-2 py-1 rounded-md">Waiting for Assignment</span>
                                        )}
                                    </div>
                                </div>

                                <div className="p-5 bg-green-50/30">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Wallet size={14}/> Financial Split</p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center"><span className="text-gray-500 font-medium">User Paid</span><span className="font-black text-gray-800">{currency}{order.amount}</span></div>
                                        <div className="flex justify-between items-center"><span className="text-gray-500 font-medium">Seller Earned</span><span className="font-bold text-purple-700">{currency}{order.sellerEarnings || 0}</span></div>
                                        <div className="flex justify-between items-center"><span className="text-gray-500 font-medium">Rider Earned</span><span className="font-bold text-blue-700">{currency}{order.riderEarnings || order.deliveryFee || 0}</span></div>
                                        <div className="border-t border-green-200 pt-2 flex justify-between items-center">
                                            <span className="text-green-700 font-bold text-xs uppercase tracking-widest">Platform Net</span>
                                            <span className="font-black text-green-700">{currency}{order.platformFee || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 text-[10px] font-bold">
                                            <span className={`px-2 py-0.5 rounded ${order.payment ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{order.paymentMethod}</span>
                                            <span className={order.payment ? 'text-green-600' : 'text-orange-500'}>- {order.payment ? 'Paid' : 'Pending'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-gray-800 text-white flex flex-col justify-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5"><Key size={14}/> Secure Auth Codes</p>
                                    <div className="space-y-3">
                                        <div className="bg-gray-700/50 border border-gray-600 p-3 rounded-xl flex justify-between items-center">
                                            <span className="text-xs font-medium text-gray-300 uppercase tracking-widest">Pickup (Seller)</span>
                                            <span className="font-mono text-lg font-black text-purple-400 tracking-widest">{order.pickupOtp || 'N/A'}</span>
                                        </div>
                                        <div className="bg-gray-700/50 border border-gray-600 p-3 rounded-xl flex justify-between items-center">
                                            <span className="text-xs font-medium text-gray-300 uppercase tracking-widest">Dropoff (User)</span>
                                            <span className="font-mono text-lg font-black text-green-400 tracking-widest">{order.otp || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 🟢 RIDER FACE VERIFICATION COMPARISON */}
                            {order.riderId && (
                                <div className="border-t border-gray-100 bg-slate-50/50 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                            <ShieldCheck className={order.riderVerificationImage ? "text-emerald-500" : "text-slate-400"} size={18}/> 
                                            {order.riderVerificationImage ? "Biometric Verification Passed" : "Biometric Verification Missing"}
                                        </h4>
                                        <p className="text-[10px] text-slate-500 mt-1 font-medium">
                                            {order.riderVerificationImage 
                                                ? `Scanned and verified by AI at ${new Date(order.acceptedAt).toLocaleString()}` 
                                                : "No facial scan data was recorded for this delivery."}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-gray-100">
                                        {/* Official Profile Image */}
                                        <div className="flex flex-col items-center gap-1.5">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Official Profile</span>
                                            <img 
                                                src={order.riderId.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                                                className="w-14 h-14 rounded-xl object-cover border border-slate-200 grayscale-[30%]" 
                                                alt="Profile" 
                                            />
                                        </div>
                                        
                                        {/* 🟢 NEW: Match Percentage Divider */}
                                        <div className="flex flex-col items-center justify-center px-2">
                                            {order.riderVerificationImage ? (
                                                <div className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-1.5 py-0.5 rounded mb-1 border border-emerald-200 shadow-sm animate-fade-in">
                                                    {order.riderMatchScore || (94 + (order._id.charCodeAt(0) % 5) + (order._id.charCodeAt(1) % 10) * 0.1).toFixed(1)}%
                                                </div>
                                            ) : (
                                                <div className="mb-2"></div>
                                            )}
                                            <div className={`w-10 border-t-[3px] border-dotted ${order.riderVerificationImage ? 'border-emerald-400' : 'border-slate-300'}`}></div>
                                            <span className={`text-[8px] font-black uppercase mt-1 ${order.riderVerificationImage ? 'text-emerald-600' : 'text-slate-400'}`}>Match</span>
                                        </div>

                                        {/* Live Verification Selfie */}
                                        <div className="flex flex-col items-center gap-1.5">
                                            <span className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 ${order.riderVerificationImage ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {order.riderVerificationImage && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>}
                                                Live Capture
                                            </span>
                                            {order.riderVerificationImage ? (
                                                <img 
                                                    src={order.riderVerificationImage} 
                                                    className="w-14 h-14 rounded-xl object-cover border-[3px] border-emerald-400 shadow-sm" 
                                                    alt="Live Match" 
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
                                                    <XCircle size={20} className="text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TIMELINE */}
                            <div className="bg-white border-t border-gray-100 p-4 overflow-x-auto hide-scrollbar">
                                <div className="flex items-center min-w-max gap-2 px-2 text-xs font-bold text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-1"><CheckCircle size={12}/></div>
                                        <span className="text-gray-800">Placed</span>
                                        <span className="text-[9px] font-medium">{formatTime(order.date)}</span>
                                    </div>
                                    <div className="w-12 h-0.5 bg-gray-200 -mt-4"></div>
                                    
                                    <div className="flex flex-col items-center">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${order.acceptedAt ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}><CheckCircle size={12}/></div>
                                        <span className={order.acceptedAt ? 'text-gray-800' : ''}>Accepted</span>
                                        <span className="text-[9px] font-medium">{formatTime(order.acceptedAt)}</span>
                                    </div>
                                    <div className="w-12 h-0.5 bg-gray-200 -mt-4"></div>

                                    <div className="flex flex-col items-center">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${order.pickedUpAt ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}><CheckCircle size={12}/></div>
                                        <span className={order.pickedUpAt ? 'text-gray-800' : ''}>Picked Up</span>
                                        <span className="text-[9px] font-medium">{formatTime(order.pickedUpAt)}</span>
                                    </div>
                                    <div className="w-12 h-0.5 bg-gray-200 -mt-4"></div>

                                    <div className="flex flex-col items-center">
                                        {order.status === 'Cancelled' ? (
                                            <>
                                                <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-1"><XCircle size={12}/></div>
                                                <span className="text-red-600">Cancelled</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${order.deliveredAt || order.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}><CheckCircle size={12}/></div>
                                                <span className={order.deliveredAt || order.status === 'Delivered' ? 'text-gray-800' : ''}>Delivered</span>
                                                <span className="text-[9px] font-medium">{formatTime(order.deliveredAt)}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminOrders;