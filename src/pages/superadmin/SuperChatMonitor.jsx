import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ShieldCheck, User } from 'lucide-react';

const SuperChatMonitor = () => {
    const { axios } = useAppContext();
    const [chats, setChats] = useState([]);

    const fetchChats = async () => {
        try {
            const { data } = await axios.get('/api/chat/all'); // Super Admin gets ALL chats
            if (data.success) setChats(data.chats);
        } catch (error) { console.error("Monitor Error"); }
    };

    useEffect(() => { fetchChats(); }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Support Monitor</h1>
            
            <div className="grid gap-4">
                {chats.map(chat => (
                    <div key={chat._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between border-b border-slate-50 pb-4 mb-4">
                            <div>
                                <h3 className="font-bold text-slate-800">{chat.userId?.name}</h3>
                                <p className="text-xs text-slate-400">User ID: {chat.userId?._id}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${chat.status === 'closed' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'}`}>{chat.status.toUpperCase()}</span>
                        </div>
                        
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {chat.messages.slice(-5).map((m, i) => (
                                <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`text-sm px-3 py-2 rounded-lg max-w-[80%] ${m.sender === 'admin' ? 'bg-purple-50 text-purple-800' : 'bg-slate-50 text-slate-700'}`}>
                                        <p>{m.text || '[Image]'}</p>
                                        {/* 👑 Show which admin replied */}
                                        {m.sender === 'admin' && m.adminId && (
                                            <p className="text-[10px] text-purple-400 mt-1 font-bold flex items-center gap-1">
                                                <ShieldCheck size={10}/> Admin: {m.adminId}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default SuperChatMonitor;