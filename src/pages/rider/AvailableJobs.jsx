import React, { useEffect, useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Package, MapPin, ArrowRight, BellRing, ShieldCheck, Loader2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RiderSelfieModal from '../../components/RiderSelfieModal';

const AvailableJobs = () => {
    const { axios, currency } = useAppContext();
    const navigate = useNavigate();
    
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // 🟢 CHECK SHIFT STATUS
    const isOnline = sessionStorage.getItem('rider_online') === 'true';
    
    // SECURITY & SOUND STATE
    const [showSelfieModal, setShowSelfieModal] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const audioRef = useRef(null);

    // Initialize the Notification Sound
    useEffect(() => {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.loop = true; 

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, []);

    const fetchJobs = async () => {
        if (!isOnline) {
            setIsLoading(false);
            return;
        }

        try {
            const { data } = await axios.get('/api/rider/available');
            if (data.success) {
                setJobs(data.orders);
            }
        } catch (error) { 
            console.error(error); 
        } finally {
            setIsLoading(false);
        }
    };

    // Poll for jobs every 5 seconds ONLY if online
    useEffect(() => {
        fetchJobs();
        if (isOnline) {
            const interval = setInterval(fetchJobs, 5000); 
            return () => clearInterval(interval);
        }
    }, [isOnline]);

    // 🟢 SOUND TRIGGER LOGIC
    useEffect(() => {
        if (jobs.length > 0 && isOnline) {
            // Play sound if jobs exist and rider is online
            audioRef.current?.play().catch(e => console.log("Waiting for interaction..."));
        } else {
            // Stop sound if no jobs or offline
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
    }, [jobs.length, isOnline]);

    // 🟢 REJECT JOB LOGIC
    const handleRejectJob = async (orderId) => {
        const loadToast = toast.loading("Dismissing job...");
        try {
            // We use the drop endpoint because it adds the rider to 'droppedByRiders'
            // so this job will permanently stop showing up for them.
            const { data } = await axios.post('/api/rider/drop', { orderId });
            if (data.success) {
                toast.success("Job dismissed.", { id: loadToast });
                // Remove from UI immediately
                setJobs(prev => prev.filter(job => job._id !== orderId));
            } else {
                toast.error(data.message, { id: loadToast });
            }
        } catch (error) {
            toast.error("Failed to dismiss job.", { id: loadToast });
        }
    };

    const initiateAcceptJob = (orderId) => {
        setSelectedJobId(orderId);
        setShowSelfieModal(true); 
    };

   // 🟢 UPDATED: Now receives an object { image, score } instead of just a string
    const handleVerificationAndAccept = async ({ image, score }) => {
        setShowSelfieModal(false);
        if (!selectedJobId) return;

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        const loadToast = toast.loading("Verifying identity & claiming order...");
        try {
            // 🟢 NEW: Sending riderMatchScore to the backend!
            await axios.post('/api/rider/accept', { 
                orderId: selectedJobId, 
                verificationImage: image,
                riderMatchScore: score 
            });
            
            console.log(`✅ HD Selfie uploaded (Match: ${score}%) and job accepted successfully!`);
            
            toast.success("Identity Verified & Job Accepted!", { id: loadToast });
            navigate('/rider/active'); 
        } catch (error) { 
            toast.error(error.response?.data?.message || "Failed to accept order.", { id: loadToast }); 
            if (jobs.length > 0 && isOnline) audioRef.current?.play();
        }
    };

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

    if (isLoading) {
        return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="animate-spin text-green-600" size={32} /></div>;
    }

    // 🟢 OFFLINE BLOCKER
    if (!isOnline) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-[70vh] text-center font-outfit max-w-md mx-auto">
                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <ShieldCheck size={48} className="text-slate-400"/>
                </div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">You are Offline</h3>
                <p className="text-slate-500 font-medium mt-2">
                    You must start your shift with Face ID verification before you can view and accept incoming jobs.
                </p>
                <button onClick={() => navigate('/rider')} className="mt-8 bg-slate-900 text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                    Go to Dashboard
                </button>
            </motion.div>
        )
    }

    if (jobs.length === 0) return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-[70vh] text-center font-outfit">
            <div className="relative">
                <div className="absolute inset-0 bg-green-200 rounded-full blur-xl animate-pulse"></div>
                <div className="relative w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-green-100">
                    <Package size={48} className="text-green-500"/>
                </div>
            </div>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">Looking for Jobs...</h3>
            <p className="text-gray-500 font-medium mt-2 max-w-xs">You are online! Keep this app open. An alarm will play when an order appears.</p>
        </motion.div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20 font-outfit">
            
            <RiderSelfieModal 
                isOpen={showSelfieModal} 
                onClose={() => {
                    setShowSelfieModal(false);
                    if (jobs.length > 0 && isOnline) audioRef.current?.play(); 
                }} 
                onVerify={handleVerificationAndAccept} 
            />

            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-red-500 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-red-200">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full animate-pulse">
                        <BellRing size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold">New Orders Available!</h3>
                        <p className="text-xs text-red-100">Accept quickly before another rider claims them.</p>
                    </div>
                </div>
                <span className="bg-white text-red-600 font-black px-3 py-1 rounded-lg text-lg">
                    {jobs.length}
                </span>
            </motion.div>

            <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
                {jobs.map(job => (
                    <motion.div variants={item} key={job._id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                        
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-green-100 transition-colors"></div>

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-green-100 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-md tracking-widest">NEW</span>
                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">#{job._id.slice(-6)}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">Deliver to {job.address.firstName}</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">You Earn</p>
                                <p className="text-3xl font-black text-green-600 tracking-tighter">{currency}{job.deliveryFee || 40}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4 mb-6 bg-gray-50 p-5 rounded-2xl border border-gray-100 relative z-10">
                            <div className="flex gap-4 items-start">
                                <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100 shrink-0 mt-0.5">
                                    <MapPin size={16} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pickup From</p>
                                    <p className="text-sm font-bold text-gray-700">GreenCart Warehouse / Seller</p>
                                </div>
                            </div>
                            <div className="w-0.5 h-6 bg-gray-200 ml-4 -my-2"></div>
                            <div className="flex gap-4 items-start">
                                <div className="bg-green-100 p-2 rounded-full shadow-sm border border-green-200 shrink-0 mt-0.5">
                                    <MapPin size={16} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-green-600/70 uppercase tracking-widest">Dropoff At</p>
                                    <p className="text-sm font-bold text-gray-700">{job.address.street}, {job.address.city}</p>
                                </div>
                            </div>
                        </div>

                        {/* 🟢 ACTION BUTTONS */}
                        <div className="flex items-center gap-3 relative z-10">
                            <button 
                                onClick={() => initiateAcceptJob(job._id)} 
                                className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black active:scale-95 transition-all shadow-lg shadow-slate-200"
                            >
                                <ShieldCheck size={18} className="text-green-400"/> Accept <ArrowRight size={18} className="hidden sm:block"/>
                            </button>
                            <button 
                                onClick={() => handleRejectJob(job._id)} 
                                className="px-6 py-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 active:scale-95 transition-all border border-red-100"
                            >
                                <XCircle size={18} /> Reject
                            </button>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

export default AvailableJobs;