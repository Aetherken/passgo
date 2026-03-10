import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from "../../context/AuthContext";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [token, setToken] = useState(searchParams.get('token') || '');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const navigate = useNavigate();
    const { checkAuth } = useAuth();

    useEffect(() => {
        if (searchParams.get('token')) {
            handleVerify(searchParams.get('token'));
        }
    }, []);

    const handleVerify = async (tokenToUse) => {
        const t = tokenToUse || token;
        if (!t) {
            setStatus('error');
            setMessage('Invalid or missing verification token.');
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
            setMessage(err.response?.data?.message || 'Verification failed. Token might be expired.');
        } finally {
            setLoading(false);
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
                            </div>

                            <div className="space-y-4">
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

                                {status === 'error' && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex gap-3 items-center">
                                        <XCircle size={18} />
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
                            </div>

                            <button
                                onClick={() => navigate('/auth')}
                                className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-[#131718] transition-colors text-sm font-semibold"
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
