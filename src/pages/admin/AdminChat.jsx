import React, { useEffect, useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User, Send, Clock, MessageSquare, Lock, Unlock, History, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminChat = () => {
    const { axios } = useAppContext();
    const [chats, setChats] = useState([]);
    
    // Store the ID, not the whole object. Derive the object during render.
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [reply, setReply] = useState("");
    const [viewHistory, setViewHistory] = useState(false); 
    
    const messagesEndRef = useRef(null);
    const latestUnreadTime = useRef(Date.now()); 
    const isFirstLoad = useRef(true); 

    const selectedChat = chats.find(c => c._id === selectedChatId) || null;
    const quickReplies = ["Hello! How can I help?", "Checking now...", "Thank you.", "Refund processed.", "Is there anything else?"];

    const playNotificationSound = () => {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.volume = 0.6;
        audio.play().catch(e => console.log("Audio play blocked by browser:", e));
    };

    const showProfessionalToast = (customerName) => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5`}>
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shadow-inner">
                                <Bell size={18} className="text-blue-600 animate-bounce" />
                            </div>
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-black text-gray-900">Support Request</p>
                            <p className="mt-1 text-xs font-medium text-gray-500">New message from <b className="text-blue-600">{customerName}</b></p>
                        </div>
                    </div>
                </div>
                <div className="flex border-l border-gray-100">
                    <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none">
                        Close
                    </button>
                </div>
            </div>
        ), { 
            id: 'global-chat-alert', // 🟢 FIX: Forces only ONE toast at a time! No more spam.
            duration: 4000, 
            position: 'top-right' 
        });
    };

    const fetchChats = async () => {
        try {
            const { data } = await axios.get('/api/chat/all');
            if (data.success) {
                setChats(data.chats);

                const unreadChats = data.chats.filter(c => !c.isReadByAdmin);
                if (unreadChats.length > 0) {
                    const maxTime = Math.max(...unreadChats.map(c => new Date(c.lastUpdated).getTime()));
                    
                    if (!isFirstLoad.current && maxTime > latestUnreadTime.current) {
                        const latestChat = unreadChats.find(c => new Date(c.lastUpdated).getTime() === maxTime);
                        playNotificationSound();
                        showProfessionalToast(latestChat?.userId?.name || 'Customer');
                    }
                    latestUnreadTime.current = Math.max(latestUnreadTime.current, maxTime);
                }
                isFirstLoad.current = false;
            }
        } catch (error) { console.error("Chat load error"); }
    };

    const sendReply = async (e) => {
        e.preventDefault();
        if(!reply.trim() || !selectedChat) return;

        // 🟢 FIX: Safe extraction prevents crashing if the user was deleted
        const targetUserId = selectedChat.userId?._id || selectedChat.userId;

        try {
            const { data } = await axios.post('/api/chat/reply', { userId: targetUserId, text: reply });
            if (data.success) { 
                setReply(""); 
                fetchChats(); 
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100); 
            } 
            else { toast.error(data.message); }
        } catch (error) { 
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to send"); 
        }
    };

    const toggleStatus = async (status) => {
        if(!confirm(`Are you sure you want to ${status} this ticket?`)) return;
        
        // 🟢 CRITICAL FIX: Safe extraction prevents JS TypeErrors
        const targetUserId = selectedChat.userId?._id || selectedChat.userId;

        try {
            // 🟢 CRITICAL FIX: Directly targeting the Admin route defined in your backend
            const { data } = await axios.post('/api/chat/admin-status', { userId: targetUserId, status });
            if (data.success) { 
                fetchChats(); 
                toast.success(`Ticket ${status === 'closed' ? 'Closed 🔒' : 'Reopened 🔓'}`); 
            } else {
                toast.error(data.message);
            }
        } catch (error) { 
            console.error(error);
            toast.error(error.response?.data?.message || "Update failed. Please check connection."); 
        }
    };

    useEffect(() => { 
        fetchChats(); 
        const intervalId = setInterval(fetchChats, 3000); 
        return () => clearInterval(intervalId); 
    }, []);

    useEffect(() => { 
        messagesEndRef.current?.scrollIntoView(); 
    }, [selectedChatId]);

    const isClosed = selectedChat?.status === 'closed';

    return (
        <div className="flex h-[calc(100vh-100px)] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm font-outfit">
            
            {/* LEFT: User List */}
            <div className="w-1/3 border-r border-gray-100 bg-gray-50 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center z-10">
                    <h2 className="font-black text-gray-800 text-lg">Support Inbox</h2>
                    {chats.filter(c => !c.isReadByAdmin).length > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse shadow-md shadow-red-500/20">
                            {chats.filter(c => !c.isReadByAdmin).length} NEW
                        </span>
                    )}
                </div>
                
                <div className="flex-1 overflow-y-auto hide-scrollbar">
                    {chats.map(chat => (
                        <div 
                            key={chat._id} 
                            onClick={() => { setSelectedChatId(chat._id); setViewHistory(false); }} 
                            className={`p-4 border-b border-gray-100 cursor-pointer transition-all ${selectedChatId === chat._id ? 'bg-white border-l-4 border-l-blue-600 shadow-sm' : 'hover:bg-gray-100/50'}`}
                        >
                            <div className="flex justify-between items-start">
                                <h4 className={`text-sm ${!chat.isReadByAdmin ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>
                                    {chat.userId?.name || 'Deleted User'}
                                </h4>
                                {chat.status === 'closed' ? (
                                    <span className="bg-gray-200 text-gray-500 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Closed</span>
                                ) : !chat.isReadByAdmin ? (
                                    <span className="bg-blue-100 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Waiting</span>
                                ) : null}
                            </div>
                            <p className={`text-xs truncate mt-1 ${!chat.isReadByAdmin ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
                                {chat.messages[chat.messages.length - 1]?.text || '📷 Attachment Sent'}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: Chat Area */}
            <div className="flex-1 flex flex-col bg-white relative">
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                    <User size={20}/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 leading-tight">{selectedChat.userId?.name || 'Deleted User'}</h3>
                                    <p className="text-xs text-gray-500 font-medium">{selectedChat.userId?.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setViewHistory(!viewHistory)} className={`p-2 rounded-lg border transition-colors ${viewHistory ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50'}`} title="View Archive">
                                    <History size={18}/>
                                </button>
                                {isClosed ? (
                                    <button onClick={() => toggleStatus('active')} className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-100 transition shadow-sm"><Unlock size={14}/> Reopen</button>
                                ) : (
                                    <button onClick={() => toggleStatus('closed')} className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition shadow-sm"><Lock size={14}/> Close Ticket</button>
                                )}
                            </div>
                        </div>

                        {/* Messages Content */}
                        <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50 flex flex-col gap-4 hide-scrollbar">
                            {viewHistory ? (
                                <div className="space-y-6">
                                    <h3 className="text-center font-black text-gray-400 uppercase text-[10px] tracking-widest bg-gray-200/50 py-1 rounded-full w-max mx-auto px-4">Archived Sessions</h3>
                                    {selectedChat.archived?.length === 0 && <p className="text-center text-gray-400 text-sm font-medium mt-10">No past history found for this user.</p>}
                                    {selectedChat.archived?.map((sess, i) => (
                                        <div key={i} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                                            <p className="text-[10px] font-black text-gray-400 border-b border-gray-100 pb-2 mb-3 tracking-wider uppercase">Closed: {new Date(sess.closedAt).toLocaleString()}</p>
                                            <div className="space-y-3">
                                                {sess.messages.map((m, j) => (
                                                    <div key={j} className={`text-sm flex flex-col ${m.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                                                        <span className={`text-[10px] font-bold mb-0.5 px-1 ${m.sender === 'admin' ? 'text-blue-500' : 'text-gray-500'}`}>
                                                            {m.sender === 'admin' ? 'Admin' : 'Customer'}
                                                        </span>
                                                        <div className={`px-4 py-2 rounded-2xl ${m.sender === 'admin' ? 'bg-blue-50 text-blue-800 rounded-tr-sm' : 'bg-gray-100 text-gray-700 rounded-tl-sm'}`}>
                                                            {m.text || <span className="italic text-gray-400">Attached an image</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {selectedChat.messages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'admin' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                                                {msg.image && (
                                                    <img src={msg.image} alt="attachment" className="mb-2 rounded-xl max-w-full h-auto cursor-pointer border border-white/20 hover:opacity-90 transition" onClick={() => window.open(msg.image, '_blank')} />
                                                )}
                                                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                                <p className={`text-[9px] mt-1.5 font-medium ${msg.sender === 'admin' ? 'text-blue-200 text-right' : 'text-gray-400 text-left'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} className="pb-2" />
                                </>
                            )}
                        </div>

                        {/* Input Area */}
                        {!viewHistory && (
                            <div className={`bg-white border-t border-gray-100 ${isClosed ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="flex gap-2 p-3 overflow-x-auto hide-scrollbar bg-gray-50/50 border-b border-gray-100">
                                    {quickReplies.map((qr, i) => (
                                        <button key={i} onClick={() => setReply(qr)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition whitespace-nowrap shadow-sm">
                                            {qr}
                                        </button>
                                    ))}
                                </div>
                                <form onSubmit={sendReply} className="p-4 flex gap-3">
                                    <input 
                                        value={reply} 
                                        onChange={(e) => setReply(e.target.value)} 
                                        placeholder={isClosed ? "Ticket is Closed" : "Type your reply to the customer..."} 
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" 
                                        disabled={isClosed} 
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={isClosed || !reply.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95" 
                                    >
                                        <Send size={16}/> Reply
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50/30">
                        <MessageSquare size={64} className="mb-4 opacity-20"/>
                        <p className="font-bold text-gray-400">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminChat;