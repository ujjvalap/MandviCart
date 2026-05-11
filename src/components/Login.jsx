import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { X, Copy, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignIn, useUser } from '@clerk/clerk-react';

const clerkAppearance = {
    variables: {
        colorPrimary: '#16a34a',
        colorText: '#1f2937',
        colorBackground: 'transparent',
        colorInputBackground: '#f9fafb',
        colorInputText: '#1f2937',
        borderRadius: '12px',
        fontFamily: '"Outfit", sans-serif',
    },
    elements: {
        rootBox: "mx-auto w-full",
        card: "shadow-none p-6 sm:p-8 bg-transparent",
        headerTitle: "text-2xl font-bold tracking-tight text-gray-900",
        headerSubtitle: "text-gray-500 text-sm mt-1",
        socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all rounded-xl py-3",
        socialButtonsBlockButtonText: "font-medium text-gray-700",
        dividerLine: "bg-gray-200",
        dividerText: "text-gray-400 text-xs font-medium uppercase tracking-wider",
        formFieldLabel: "text-gray-700 font-medium text-sm mb-1",
        formFieldInput: "rounded-xl border-gray-200 bg-gray-50 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all shadow-sm",
        formButtonPrimary: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30 rounded-xl transition-all py-3 font-semibold text-[15px] normal-case tracking-wide mt-2",
        footerActionText: "text-gray-500",
        footerActionLink: "text-green-600 hover:text-green-700 font-semibold hover:underline",
        identityPreviewText: "text-gray-700 font-medium",
        identityPreviewEditButton: "text-green-600 hover:text-green-700 transition-colors",
    }
};

const demoAccounts = [
    { role: 'Admin', email: 'admin@test.com', pass: 'MandviAdmin!2026' },
    { role: 'Seller', email: 'seller@test.com', pass: 'MandviSeller!2026' },
    { role: 'Rider', email: 'rider@test.com', pass: 'MandviRider!2026' },
    { role: 'Customer', email: 'user@test.com', pass: 'MandviCustomer!2026' },
];

const Login = () => {
    const { setShowUserLogin } = useAppContext();
    const { isSignedIn } = useUser();
    const [copiedContent, setCopiedContent] = useState('');

    useEffect(() => {
        if (isSignedIn) {
            setShowUserLogin(false);
        }
    }, [isSignedIn, setShowUserLogin]);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedContent(text);
        setTimeout(() => setCopiedContent(''), 2000);
    };

    return (
        <div className='fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 overflow-y-auto'>
            <button
                onClick={() => setShowUserLogin(false)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-lg transition-all z-[1001] hover:rotate-90 duration-300"
            >
                <X size={24} strokeWidth={2} />
            </button>

            <div className="flex flex-col lg:flex-row gap-6 w-full max-w-[850px] items-center lg:items-stretch py-10 mt-[10vh] lg:mt-0">
                {/* Auth Side */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300, delay: 0.1 }}
                    className="relative w-full max-w-[400px]"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-[2rem] blur-lg opacity-30"></div>
                    <div className="relative bg-white rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-gray-100 h-full flex flex-col justify-center">
                        <SignIn
                            routing="hash"
                            forceRedirectUrl={false}
                            appearance={clerkAppearance}
                            localization={{
                                signIn: {
                                    start: {
                                        title: 'Sign in to Mandvi Cart',
                                    }
                                }
                            }}
                        />
                    </div>
                </motion.div>

                {/* Demo Accounts Panel */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300, delay: 0.2 }}
                    className="relative w-full max-w-[400px] lg:max-w-sm"
                >
                    <div className="relative bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-white/50 p-6 sm:p-8 h-full flex flex-col border border-white/40">
                        <div className="mb-6">
                            <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-indigo-50 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-3">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                Portfolio Demo Mode
                            </span>
                            <h3 className="text-xl font-bold text-gray-900">Test Credentials</h3>
                            <p className="text-gray-500 text-sm mt-1">Use these accounts to explore different dashboards without signing up.</p>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            {demoAccounts.map((acc, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-100/80 hover:border-indigo-100 hover:shadow-sm transition-all group">
                                    <p className="text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                                        {acc.role}
                                    </p>

                                    {/* Email */}
                                    <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100 mb-1.5">
                                        <span className="text-sm text-gray-600 font-medium truncate">{acc.email}</span>
                                        <button
                                            onClick={() => handleCopy(acc.email)}
                                            className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                                            title="Copy Email"
                                        >
                                            {copiedContent === acc.email ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                                        </button>
                                    </div>

                                    {/* Password */}
                                    <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                                        <span className="text-sm text-gray-600 font-mono tracking-wider">{acc.pass}</span>
                                        <button
                                            onClick={() => handleCopy(acc.pass)}
                                            className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                                            title="Copy Password"
                                        >
                                            {copiedContent === acc.pass ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;