import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from "../../context/AuthContext";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const { user, checkAuth } = useAuth();
    const navigate = useNavigate();

    const [token, setToken] = useState(searchParams.get('token') || '');
    const [email, setEmail] = useState(searchParams.get('email') || user?.email || '');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user?.email && !email) setEmail(user.email);
    }, [user]);

    useEffect(() => {
        if (searchParams.get('token')) {
            handleVerify(searchParams.get('token'));
        }
    }, []);

    const handleVerify = async (tokenToUse) => {
        const t = tokenToUse || token;
        if (!t) {
            setStatus('error');
            setMessage('Please enter your 6-digit verification code.');
            return;
        }

        setStatus('loading');
        setLoading(true);

        try {
            const response = await api.post('/auth/verify-email', { token: t, email });
            setStatus('success');
            setMessage(response.data.message);
            await checkAuth(); // Update local state
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Verification failed. Code might be incorrect or expired.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            setStatus('error');
            setMessage('Please enter your email to resend the code.');
            return;
        }

        setResending(true);
        try {
            const response = await api.post('/auth/resend-verification', { email });
            setStatus('idle');
            setMessage('New verification code sent to your email.');
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Failed to resend code.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#131718] flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-md">
                <p className="font-display text-4xl text-white tracking-widest text-center mb-2">PASSGO</p>
                <p className="text-center text-gray-400 text-sm mb-8">Email Verification</p>

                <div className="bg-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {status === 'success' ? (
                        <div className="text-center py-6">
                            <div className="flex justify-center mb-4">
                                <CheckCircle size={64} className="text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verified!</h2>
                            <p className="text-gray-600 mb-8">{message}</p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full bg-[#131718] text-white py-4 rounded-xl font-semibold text-sm hover:opacity-90 transition-all"
                            >
                                Go to Dashboard →
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-gray-600">
                                    Please enter the 6-digit code sent to your email.
                                </p>
                                {email && <p className="text-xs font-semibold text-gray-400 mt-1">{email}</p>}
                            </div>

                            <div className="space-y-4">
                                {!email && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="john@vjec.ac.in"
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#131718] focus:outline-none transition-colors"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                        Verification Code
                                    </label>
                                    <input
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        placeholder="123456"
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:border-[#131718] focus:outline-none transition-colors"
                                        maxLength={6}
                                    />
                                </div>

                                {(status === 'error' || (status === 'idle' && message)) && (
                                    <div className={`border rounded-xl px-4 py-3 flex gap-3 items-center text-sm ${status === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-blue-50 border-blue-200 text-blue-600'
                                        }`}>
                                        {status === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                        <span>{message}</span>
                                    </div>
                                )}

                                <button
                                    onClick={() => handleVerify()}
                                    disabled={loading || token.length < 6}
                                    className="w-full bg-[#131718] text-white py-4 rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 mt-2"
                                >
                                    {loading ? 'Verifying...' : 'Verify Email →'}
                                </button>

                                <div className="text-center">
                                    <p className="text-xs text-gray-400">
                                        Didn't receive the code?{' '}
                                        <button
                                            onClick={handleResend}
                                            disabled={resending || !email}
                                            className="text-[#131718] font-bold hover:underline disabled:opacity-50"
                                        >
                                            {resending ? 'Sending...' : 'Resend Code'}
                                        </button>
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/auth')}
                                className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-[#131718] transition-colors text-sm font-semibold pt-4 border-t border-gray-100"
                            >
                                <ArrowLeft size={16} /> Back to Sign In
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
