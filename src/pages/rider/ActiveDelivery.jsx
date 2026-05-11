import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ActiveDeliveryMap from '../../components/ActiveDeliveryMap'; 
import { Clock, Package } from 'lucide-react';

const ActiveDelivery = () => {
    const { axios, user } = useAppContext();
    const navigate = useNavigate();
    const [activeOrders, setActiveOrders] = useState(null);
    const [loading, setLoading] = useState(true);
    const [jobTimer, setJobTimer] = useState("00:00");

    const fetchActiveJob = async () => {
        try {
            const { data } = await axios.get('/api/rider/my-jobs');
            if (data.success) {
                const ongoing = data.orders.filter(o => 
                    ['Ready for Pickup', 'Out for Delivery'].includes(o.status)
                );

                if (ongoing.length > 0) {
                    const firstOrderUser = ongoing[0].userId;
                    const group = ongoing.filter(o => o.userId === firstOrderUser);
                    setActiveOrders(group);
                    
                    const jobStartTime = sessionStorage.getItem(`job_start_${group[0]._id}`) || Date.now();
                    if (!sessionStorage.getItem(`job_start_${group[0]._id}`)) {
                        sessionStorage.setItem(`job_start_${group[0]._id}`, jobStartTime);
                    }
                } else {
                    setActiveOrders(null);
                }
            }
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchActiveJob();
    }, []);

    useEffect(() => {
        let interval;
        if (activeOrders && activeOrders.length > 0) {
            interval = setInterval(() => {
                const startTime = sessionStorage.getItem(`job_start_${activeOrders[0]._id}`);
                if (startTime) {
                    const diff = Math.floor((Date.now() - parseInt(startTime)) / 1000);
                    const mins = String(Math.floor(diff / 60)).padStart(2, '0');
                    const secs = String(diff % 60).padStart(2, '0');
                    setJobTimer(`${mins}:${secs}`);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeOrders]);

    const handleComplete = async (orders, otp) => {
        const loadToast = toast.loading("Verifying OTP securely...");
        try {
            for (const order of orders) {
                await axios.post('/api/rider/complete', { orderId: order._id, otp });
                sessionStorage.removeItem(`job_start_${order._id}`); 
            }
            
            // 🟢 PREMIUM REWARD NOTIFICATION
            toast.success("Delivery Confirmed! Earnings secured.", { 
                id: loadToast,
                icon: '🏆', // Professional trophy icon instead of money emoji
                duration: 4000,
                style: {
                    background: '#064E3B', // Deep, rich emerald green
                    color: '#ECFDF5', // Soft mint text
                    padding: '16px 24px',
                    borderRadius: '16px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.4)', // Glowing green shadow
                }
            });

            setActiveOrders(null); 
            // Increased timeout to 1.5 seconds so the rider has time to see the beautiful toast
            setTimeout(() => { navigate('/rider/dashboard'); }, 1500); 
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid OTP", { id: loadToast });
        }
    };

    const handleDropJob = async (orderId) => {
        if (!window.confirm("🚨 Are you sure you want to drop this delivery? It will be reassigned to another nearby rider.")) return;
        
        const loadToast = toast.loading("Reassigning job...");
        try {
            const { data } = await axios.post('/api/rider/drop', { orderId });
            
            if (data.success) {
                toast.success("Job dropped. Back to dashboard.", { id: loadToast });
                sessionStorage.removeItem(`job_start_${orderId}`);
                setActiveOrders(null); 
                setTimeout(() => { navigate('/rider/dashboard'); }, 500); 
            } else {
                toast.error(data.message, { id: loadToast });
            }
        } catch (error) {
            toast.error("Failed to drop job.", { id: loadToast });
        }
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50 font-outfit">
            <div className="w-24 h-24 bg-white rounded-full shadow-xl shadow-green-100 flex items-center justify-center mb-6 animate-bounce">
                <Package size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-800">Locating Active Jobs...</h2>
            <p className="text-gray-500 mt-2 font-medium">Syncing with GreenCart Servers</p>
        </div>
    );

    if (!activeOrders) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 font-outfit">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-5xl shadow-inner border border-green-200">🎉</div>
                <h2 className="text-3xl font-black text-gray-800 mb-2">All Caught Up!</h2>
                <p className="text-gray-500 mb-8 font-medium">You have no active deliveries at the moment.</p>
                <button onClick={() => navigate('/rider/dashboard')} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:bg-black hover:scale-105 active:scale-95 transition-all">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen absolute inset-0 z-50 bg-white font-outfit">
            
            {/* 🟢 FLOATING JOB TIMER */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg shadow-gray-200/50 border border-gray-100 flex items-center gap-2">
                <Clock size={18} className="text-green-500 animate-pulse"/>
                <span className="font-bold text-gray-800 tracking-wide text-sm">{jobTimer}</span>
            </div>

            <ActiveDeliveryMap 
                orders={activeOrders} 
                onComplete={handleComplete} 
                onDrop={handleDropJob}
                viewMode="rider" 
                rider={user} 
            />
        </div>
    );
};

export default ActiveDelivery;