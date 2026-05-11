import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';

const NewsLetter = () => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email) {
            toast.success("Thanks for subscribing to our newsletter!");
            setEmail(''); // Clear the input after submitting
        }
    };

    return (
        <div className="flex flex-col items-center justify-center text-center space-y-4 mt-24 pb-14 px-4 font-outfit">
            <h1 className="md:text-4xl text-3xl font-black text-slate-900 tracking-tight">
                Never Miss a Deal!
            </h1>
            <p className="md:text-lg text-slate-500 font-medium pb-4 max-w-xl">
                Get the latest offers, fresh arrivals, and exclusive Mandvi Cart discounts delivered straight to your inbox.
            </p>
            
            <form onSubmit={handleSubmit} className="relative max-w-xl w-full h-14">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Mail className="text-slate-400" size={20} />
                </div>
                <input
                    className="block w-full h-full pl-14 pr-6 bg-white border border-slate-200 rounded-full text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400"
                    type="email"
                    placeholder="Enter your email address and press Enter..."
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </form>
        </div>
    );
};

export default NewsLetter;