import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Clock, CheckCircle, Landmark, ArrowLeft, CheckCircle2, Download, FileText, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const RiderWallet = () => {
    const { axios, currency, user, fetchUserProfile } = useAppContext();
    const navigate = useNavigate();
    
    // State
    const [history, setHistory] = useState([]);         // Deliveries
    const [payouts, setPayouts] = useState([]);         // Withdrawals
    const [activeTab, setActiveTab] = useState('deliveries'); // 'deliveries' or 'withdrawals'
    
    const pendingPayout = user?.pendingWithdrawals || 0;
    const totalWithdrawn = user?.totalWithdrawn || 0;

    const fetchData = async () => {
        try {
            // Fetch Delivery History
            const jobRes = await axios.get('/api/rider/my-jobs');
            if (jobRes.data.success) {
                const deliveredJobs = jobRes.data.orders.filter(o => o.status === 'Delivered');
                setHistory(deliveredJobs);
            }

            // 🟢 Fetch Withdrawal History
            const payoutRes = await axios.get('/api/payout/user');
            if (payoutRes.data.success) {
                setPayouts(payoutRes.data.payouts);
            }
        } catch (error) { console.error(error); }
    };

    useEffect(() => { 
        fetchData(); 
        if (fetchUserProfile) fetchUserProfile(); 
    }, []);

    const totalLifetimeEarnings = history.reduce((sum, o) => sum + (o.riderEarnings || o.deliveryFee || 40), 0);
    const availableBalance = totalLifetimeEarnings - pendingPayout - totalWithdrawn;

    const handleWithdraw = async () => {
        if(availableBalance < 500) return toast.error(`Minimum withdrawal is ${currency}500`);
        const load = toast.loading("Processing Transfer to Bank...");
        try {
            const { data } = await axios.post('/api/payout/request', { amount: availableBalance });
            if(data.success) {
                toast.success("Withdrawal Requested Successfully!", { id: load });
                fetchData(); // Refresh both tables
                if (fetchUserProfile) await fetchUserProfile(); 
            } else {
                toast.error(data.message, { id: load });
            }
        } catch (error) { toast.error("Error processing request", { id: load }); }
    };

    // 🟢 DOWNLOAD STATEMENT (PDF GENERATOR)
    const downloadStatement = () => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(22, 163, 74); // GreenCart Green
        doc.text("GreenCart Financial Statement", 14, 22);
        
        // User Info
        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.text(`Rider Name: ${user?.name}`, 14, 32);
        doc.text(`Email: ${user?.email}`, 14, 38);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 44);
        
        // Summary Block
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42); // Slate 900
        doc.text("Account Summary", 14, 60);
        doc.setFontSize(12);
        doc.text(`Lifetime Earnings: ${currency}${totalLifetimeEarnings.toLocaleString()}`, 14, 68);
        doc.text(`Total Withdrawn: ${currency}${totalWithdrawn.toLocaleString()}`, 14, 74);
        doc.text(`Pending Payouts: ${currency}${pendingPayout.toLocaleString()}`, 14, 80);
        doc.text(`Available Balance: ${currency}${Math.max(0, availableBalance).toLocaleString()}`, 14, 86);

        // Deliveries Table
        doc.setFontSize(14);
        doc.text("Delivery Earnings History", 14, 102);
        autoTable(doc, {
            startY: 106,
            headStyles: { fillColor: [22, 163, 74] },
            head: [['Order ID', 'Date & Time', 'Earned Amount']],
            body: history.slice().reverse().map(job => [
                `#${job._id.slice(-6).toUpperCase()}`,
                new Date(job.date).toLocaleString(),
                `${currency}${job.riderEarnings || job.deliveryFee || 40}`
            ])
        });

        // Withdrawals Table
        const finalY = doc.lastAutoTable.finalY || 106;
        doc.setFontSize(14);
        doc.text("Withdrawal Requests", 14, finalY + 14);
        autoTable(doc, {
            startY: finalY + 18,
            headStyles: { fillColor: [15, 23, 42] }, // Slate 900
            head: [['Request Date', 'Status', 'Transaction ID', 'Amount']],
            body: payouts.map(p => [
                new Date(p.requestDate).toLocaleString(),
                p.status.toUpperCase(),
                p.transactionId || 'N/A',
                `${currency}${p.amount}`
            ])
        });

        doc.save(`GreenCart_Statement_${user?.name.split(' ')[0]}.pdf`);
        toast.success("Statement Downloaded!");
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20 font-outfit">
            
            {/* Header & Download Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/rider/dashboard')} className="p-3 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors shadow-sm">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800">Wallet & Earnings</h2>
                        <p className="text-sm font-medium text-gray-500">Manage your payouts</p>
                    </div>
                </div>
                <button onClick={downloadStatement} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-sm">
                    <Download size={16} /> Download Statement
                </button>
            </div>

            {/* 💳 WALLET CARD */}
            <div className="bg-slate-900 text-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-300 relative overflow-hidden flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="relative z-10">
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">Available Balance</p>
                    <h1 className="text-5xl md:text-6xl font-black mb-1">{currency}{Math.max(0, availableBalance).toLocaleString()}</h1>
                    
                    {pendingPayout > 0 && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 px-4 py-2 rounded-xl">
                            <Clock size={16} className="text-yellow-400 animate-pulse"/>
                            <span className="text-sm font-medium text-slate-200"><span className="text-white font-bold">{currency}{pendingPayout.toLocaleString()}</span> pending transfer</span>
                        </div>
                    )}
                    {totalWithdrawn > 0 && (
                        <div className="mt-2 inline-flex items-center gap-2 px-4 py-1">
                            <CheckCircle2 size={14} className="text-emerald-400"/>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lifetime Withdrawn: {currency}{totalWithdrawn.toLocaleString()}</span>
                        </div>
                    )}
                </div>

                <button onClick={handleWithdraw} disabled={availableBalance < 500} className="relative z-10 w-full md:w-auto bg-white text-slate-900 px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2">
                    <Landmark size={18}/> Withdraw Funds
                </button>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20 pointer-events-none"></div>
            </div>

            {/* 🟢 TABS: Deliveries vs Withdrawals */}
            <div>
                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-max mb-6">
                    <button onClick={() => setActiveTab('deliveries')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'deliveries' ? 'bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <CheckCircle size={16}/> Earnings
                    </button>
                    <button onClick={() => setActiveTab('withdrawals')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'withdrawals' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <ArrowUpRight size={16}/> Withdrawals
                    </button>
                </div>

                {/* 📜 DYNAMIC LIST */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden p-2">
                    
                    {/* SHOW EARNINGS */}
                    {activeTab === 'deliveries' && history.slice().reverse().map(job => (
                        <div key={job._id} className="p-4 sm:p-6 flex justify-between items-center hover:bg-gray-50 transition-colors rounded-3xl">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-sm border border-green-100"><CheckCircle size={22} /></div>
                                <div>
                                    <p className="font-bold text-gray-800">Order #{job._id.slice(-6).toUpperCase()}</p>
                                    <p className="text-xs font-medium text-gray-400 mt-0.5">{new Date(job.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="font-black text-lg text-emerald-600">+{currency}{job.riderEarnings || job.deliveryFee || 40}</span>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Credited</p>
                            </div>
                        </div>
                    ))}

                    {/* SHOW WITHDRAWALS */}
                    {activeTab === 'withdrawals' && payouts.map(p => (
                        <div key={p._id} className="p-4 sm:p-6 flex justify-between items-center hover:bg-gray-50 transition-colors rounded-3xl">
                            <div className="flex gap-4 items-center">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border ${p.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : p.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'}`}>
                                    <Landmark size={22} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 capitalize">Transfer {p.status}</p>
                                    <p className="text-xs font-medium text-gray-400 mt-0.5">{new Date(p.requestDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`font-black text-lg ${p.status === 'rejected' ? 'text-red-500 line-through' : 'text-slate-800'}`}>
                                    -{currency}{p.amount}
                                </span>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Bank Transfer</p>
                            </div>
                        </div>
                    ))}

                    {/* EMPTY STATES */}
                    {activeTab === 'deliveries' && history.length === 0 && (
                        <div className="p-12 text-center text-gray-400 flex flex-col items-center"><FileText size={32} className="mb-3 opacity-50"/><p className="font-medium text-gray-600">No completed deliveries yet.</p></div>
                    )}
                    {activeTab === 'withdrawals' && payouts.length === 0 && (
                        <div className="p-12 text-center text-gray-400 flex flex-col items-center"><Landmark size={32} className="mb-3 opacity-50"/><p className="font-medium text-gray-600">No withdrawal requests yet.</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RiderWallet;