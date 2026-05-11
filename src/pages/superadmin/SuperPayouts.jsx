import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { CheckCircle, Clock, Landmark, CreditCard } from 'lucide-react';

const SuperPayouts = () => {
    const { axios, currency } = useAppContext();
    const [payouts, setPayouts] = useState([]);
    const [filter, setFilter] = useState('pending'); // pending | paid

    const fetchPayouts = async () => {
        try {
            // 🟢 FIXED: Updated to match your adminRoute.js paths!
            const { data } = await axios.get(`/api/admin/payouts?status=${filter}`);
            if (data.success) setPayouts(data.payouts);
        } catch (error) { toast.error("Error loading payouts"); }
    };

    const processRequest = async (id, status) => {
        if(!window.confirm(`Are you sure you want to mark this request as ${status.toUpperCase()}?`)) return;
        try {
            // 🟢 FIXED: Updated to match your adminRoute.js paths!
            const { data } = await axios.post('/api/admin/payout-process', { payoutId: id, status });
            if (data.success) { 
                toast.success(data.message); 
                fetchPayouts(); 
            } else {
                toast.error(data.message);
            }
        } catch (error) { toast.error("Processing failed"); }
    };

    useEffect(() => { fetchPayouts(); }, [filter]);

    return (
        <div className="space-y-6 pb-20">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Financial Control</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage Seller and Rider withdrawals</p>
                </div>
                <div className="flex bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 w-max">
                    {['pending', 'paid'].map(f => (
                        <button 
                            key={f} 
                            onClick={() => setFilter(f)} 
                            className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filter === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            {f === 'pending' ? 'Pending Requests' : 'Completed Payouts'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Payouts Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                            <tr>
                                <th className="p-6">User Details</th>
                                <th className="p-6">Payment Info</th>
                                <th className="p-6">Amount</th>
                                <th className="p-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payouts.map(p => (
                                <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                                    
                                    {/* User Details */}
                                    <td className="p-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-800 text-lg">{p.userId?.name}</span>
                                            <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{p.role} • {p.userId?.email}</span>
                                        </div>
                                    </td>

                                    {/* 🟢 NEW: Bank / UPI Details Display */}
                                    <td className="p-6">
                                        <div className="flex flex-col gap-2">
                                            {p.userId?.upiId ? (
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg w-max">
                                                    <Landmark size={14} className="text-emerald-600" /> 
                                                    UPI: <span className="font-bold font-mono">{p.userId.upiId}</span>
                                                </div>
                                            ) : null}
                                            
                                            {p.userId?.bankAccount?.accountNumber ? (
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg w-max">
                                                    <CreditCard size={14} className="text-blue-600" />
                                                    Bank: <span className="font-bold font-mono">{p.userId.bankAccount.accountNumber}</span> 
                                                    <span className="text-xs text-slate-400 ml-1">(IFSC: {p.userId.bankAccount.ifsc})</span>
                                                </div>
                                            ) : null}

                                            {(!p.userId?.upiId && !p.userId?.bankAccount?.accountNumber) && (
                                                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded w-max">No Payment Details Provided</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Amount & Date */}
                                    <td className="p-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-2xl text-emerald-600">{currency}{p.amount}</span>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                {new Date(p.requestDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="p-6 text-right">
                                        {filter === 'pending' ? (
                                            <div className="flex items-center justify-end gap-3">
                                                <button onClick={() => processRequest(p._id, 'rejected')} className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors shadow-sm">
                                                    Reject
                                                </button>
                                                <button onClick={() => processRequest(p._id, 'paid')} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors shadow-md">
                                                    Mark as Paid
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-100">
                                                <CheckCircle size={16}/> Paid Successfully
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {payouts.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <Clock size={40} className="mb-4 opacity-50"/>
                                            <h3 className="text-lg font-bold text-slate-600">No {filter} payouts</h3>
                                            <p className="text-sm font-medium mt-1">You're all caught up!</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuperPayouts;