import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function Auth() {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ name: '', studentId: '', phone: '', email: '', password: '' });

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let user;
            if (mode === 'login') {
                user = await login(form.email, form.password);
            } else {
                user = await register({ name: form.name, studentId: form.studentId, phone: form.phone, email: form.email, password: form.password });
            }
            if (user.role === 'student') navigate('/dashboard');
            else navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#131718] flex items-center justify-center px-4 py-16">
            {/* Back to home */}
            <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
                <ArrowLeft size={16} /> Back
            </Link>

            <div className="w-full max-w-md">
                {/* Logo */}
                <p className="font-display text-4xl text-white tracking-widest text-center mb-2">PASSGO</p>
                <p className="text-center text-gray-400 text-sm mb-8">Campus Bus Pass Platform</p>

                {/* Card */}
                <div className="bg-white rounded-3xl p-8 shadow-2xl">
                    {/* Toggle */}
                    <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
                        {['login', 'register'].map(m => (
                            <button key={m} onClick={() => { setMode(m); setError(''); }}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${mode === m ? 'bg-[#131718] text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
                                {m === 'login' ? 'Log In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'register' && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                                    <input name="name" value={form.name} onChange={handleChange} required
                                        placeholder="John Doe"
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Student ID</label>
                                    <input name="studentId" value={form.studentId} onChange={handleChange} required
                                        placeholder="VJEC2024001"
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                                    <input name="phone" value={form.phone} onChange={handleChange}
                                        placeholder="+91 9876543210" type="tel"
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none transition-colors" />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                            <input name="email" value={form.email} onChange={handleChange} required type="email"
                                placeholder="john@vjec.ac.in"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none transition-colors" />
                        </div>

                        <div className="relative">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                            <input name="password" value={form.password} onChange={handleChange} required
                                type={showPass ? 'text' : 'password'} placeholder="••••••••"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none transition-colors pr-12" />
                            <button type="button" onClick={() => setShowPass(s => !s)}
                                className="absolute right-4 top-9 text-gray-400 hover:text-gray-700">
                                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full bg-[#131718] text-white py-4 rounded-xl font-semibold text-sm hover:bg-[#FEC29F] hover:text-[#131718] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                            {loading ? 'Please wait...' : (mode === 'login' ? 'Log In →' : 'Create Account →')}
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                            className="text-[#131718] font-semibold hover:underline">
                            {mode === 'login' ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </div>

                {/* Decorative pills */}
                <div className="flex justify-center gap-3 mt-8">
                    {['#FEC29F', '#D1E6F6', '#FFDAE4'].map(c => (
                        <div key={c} className="w-8 h-8 rounded-full opacity-60" style={{ backgroundColor: c }} />
                    ))}
                </div>
            </div>
        </div>
    );
}
