import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import QrScannerModal from '../../components/QrScannerModal';
import {
    QrCode,
    LogOut,
    Bus,
    Users,
    CheckCircle,
    XCircle,
    Loader2,
    Calendar,
    ChevronRight,
    Search,
    Camera
} from 'lucide-react';

export default function DriverDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // { success: bool, message: string }
    const [scannerOpen, setScannerOpen] = useState(false);
    const [recentVerifications, setRecentVerifications] = useState([]);

    useEffect(() => {
        if (!user || (user.role !== 'driver' && user.role !== 'admin' && user.role !== 'superadmin')) {
            navigate('/auth');
        }
    }, [user, navigate]);

    const cleanTokenString = (raw) => {
        if (!raw) return '';
        let cleaned = String(raw).trim();
        try {
            if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
                const url = new URL(cleaned);
                const queryToken = url.searchParams.get('token') || url.searchParams.get('id');
                if (queryToken) return queryToken;
                const parts = url.pathname.split('/').filter(Boolean);
                if (parts.length > 0) return parts[parts.length - 1];
            }
        } catch {
            // keep cleaned string
        }
        return cleaned;
    };

    const [totalBoarded, setTotalBoarded] = useState(42);
    const today = new Date();
    const dayNumber = today.getDate().toString().padStart(2, '0');
    const monthYear = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const handleVerifyToken = async (e, directToken = null) => {
        if (e && e.preventDefault) e.preventDefault();
        const targetToken = cleanTokenString(directToken || token);
        if (!targetToken) return;

        setLoading(true);
        setResult(null);
        try {
            const res = await api.patch(`/bookings/${targetToken}/verify`);
            setResult({
                success: true,
                message: res.data.message,
                booking: res.data.booking
            });
            setTotalBoarded(count => count + 1);
            setRecentVerifications(prev => [{
                token: targetToken,
                time: new Date().toLocaleTimeString(),
                success: true,
                passenger: res.data.booking?.student_name,
                destination: res.data.booking?.destination
            }, ...prev].slice(0, 5));
            setToken('');
        } catch (err) {
            setResult({
                success: false,
                message: err.response?.data?.message || 'Verification failed.'
            });
            setRecentVerifications(prev => [{
                token: targetToken,
                time: new Date().toLocaleTimeString(),
                success: false
            }, ...prev].slice(0, 5));
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/auth');
    };

    return (
        <div className="min-h-screen bg-[#131718] text-white">
            {/* Header */}
            <header className="px-6 pt-10 pb-6 border-b border-white/5">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-[#FEC29F] text-xs font-bold uppercase tracking-[0.2em] mb-1">Driver Portal</p>
                        <h1 className="font-display text-4xl tracking-tight">TERMINAL</h1>
                    </div>
                    <button onClick={handleLogout} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                        <LogOut size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                    <div className="w-12 h-12 bg-[#FEC29F] rounded-2xl flex items-center justify-center text-[#131718]">
                        <Bus size={24} />
                    </div>
                    <div>
                        <p className="font-display text-lg leading-none mb-1">{user?.name || 'Driver'}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">{user?.role}</p>
                    </div>
                </div>
            </header>

            <main className="p-6 space-y-8">
                {/* Verification Section */}
                <section className="bg-white rounded-[40px] p-8 text-[#131718]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-[#D1E6F6] rounded-xl flex items-center justify-center">
                            <QrCode size={20} />
                        </div>
                        <h2 className="font-display text-2xl uppercase italic">Verify Pass</h2>
                    </div>

                    {!result ? (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Enter the ticket token or use the scanner to verify a student's bus pass.
                            </p>

                            <form onSubmit={handleVerifyToken} className="relative">
                                <input
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="Enter Pass Token..."
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl px-6 py-5 text-lg font-mono focus:border-[#131718] focus:outline-none transition-all pr-16"
                                />
                                <button
                                    disabled={loading || !token.trim()}
                                    type="submit"
                                    className="absolute right-2 top-2 bottom-2 aspect-square bg-[#131718] text-white rounded-2xl flex items-center justify-center hover:bg-[#FEC29F] hover:text-[#131718] transition-all disabled:opacity-30"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <ChevronRight size={24} />}
                                </button>
                            </form>

                            <button
                                type="button"
                                onClick={() => setScannerOpen(true)}
                                className="w-full py-5 rounded-3xl border-2 border-dashed border-[#131718]/25 hover:border-[#131718] bg-gray-50 hover:bg-[#FEC29F]/15 text-[#131718] font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-sm group"
                            >
                                <div className="w-8 h-8 rounded-xl bg-[#131718] text-white group-hover:bg-[#FEC29F] group-hover:text-[#131718] flex items-center justify-center transition-colors">
                                    <Camera size={18} />
                                </div>
                                <span>Open Camera QR Scanner</span>
                            </button>
                        </div>
                    ) : (
                        <div className={`p-8 rounded-[32px] text-center space-y-6 transition-all animate-in fade-in zoom-in duration-300 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${result.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {result.success ? <CheckCircle size={40} /> : <XCircle size={40} />}
                            </div>
                            <div>
                                <h3 className={`font-display text-3xl mb-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                                    {result.success ? 'PASS VERIFIED' : 'INVALID PASS'}
                                </h3>
                                <p className="text-gray-700 font-medium text-sm leading-relaxed">{result.message}</p>

                                {result.booking && (
                                    <div className="mt-5 p-5 bg-white rounded-2xl border border-green-200 text-left text-xs space-y-2 font-mono shadow-sm">
                                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                            <span className="text-gray-400 uppercase tracking-wider text-[10px]">Passenger</span>
                                            <span className="font-bold text-gray-800 text-sm">{result.booking.student_name || 'Student'}</span>
                                        </div>
                                        {result.booking.student_id && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Student ID:</span>
                                                <span className="font-bold text-gray-700">{result.booking.student_id}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Route:</span>
                                            <span className="font-bold text-gray-700">{result.booking.origin} → {result.booking.destination}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Bus / Departure:</span>
                                            <span className="font-bold text-gray-700">{result.booking.bus_number || 'Bus'} ({result.booking.departure_time?.slice(0, 5) || 'Today'})</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Pass Status:</span>
                                            <span className="font-bold text-green-600 uppercase text-[10px] bg-green-100 px-2 py-0.5 rounded-full">Boarded (Used)</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setResult(null)}
                                className="w-full bg-[#131718] text-white py-4 rounded-3xl font-bold uppercase tracking-widest text-sm hover:bg-[#FEC29F] hover:text-[#131718] transition-all"
                            >
                                Verify Next Pass
                            </button>
                        </div>
                    )}
                </section>

                {/* Stats / Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-[32px] p-6">
                        <Users className="text-[#D1E6F6] mb-3" size={24} />
                        <p className="text-4xl font-display leading-none mb-1">{totalBoarded}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total Boarded</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-[32px] p-6">
                        <Calendar className="text-[#FFF6C6] mb-3" size={24} />
                        <p className="text-4xl font-display leading-none mb-1">{dayNumber}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{monthYear}</p>
                    </div>
                </div>

                {/* Recent Activity */}
                <section>
                    <div className="flex justify-between items-end mb-6">
                        <h2 className="font-display text-2xl uppercase italic">Recent</h2>
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Last 5 Scans</span>
                    </div>

                    <div className="space-y-3">
                        {recentVerifications.length > 0 ? recentVerifications.map((v, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-1.5 h-1.5 rounded-full ${v.success ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-400'}`} />
                                    <div>
                                        <p className="font-mono text-sm text-gray-300">
                                            {v.passenger ? `${v.passenger} (${v.destination || 'Pass'})` : `${v.token.slice(0, 8)}...`}
                                        </p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">{v.time}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${v.success ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                                    {v.success ? 'Verified' : 'Failed'}
                                </span>
                            </div>
                        )) : (
                            <div className="text-center py-10 border-2 border-dashed border-white/10 rounded-[32px]">
                                <p className="text-gray-500 text-sm">No recent activity</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Bottom Nav Spacer */}
            <div className="h-20" />

            {/* QR Camera Scanner Modal */}
            <QrScannerModal
                isOpen={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScanSuccess={(scannedText) => {
                    handleVerifyToken(null, scannedText);
                }}
            />
        </div>
    );
}
