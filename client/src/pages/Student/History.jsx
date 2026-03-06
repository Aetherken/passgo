import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../api/client';
import { ArrowLeft, ChevronDown, ChevronUp, Filter } from 'lucide-react';

const STATUS_COLORS = {
    active: 'bg-green-100 text-green-700',
    used: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-100 text-red-600',
};

export default function History() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        api.get('/bookings/my')
            .then(r => setBookings(r.data))
            .catch(() => setBookings([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = filterStatus === 'all' ? bookings : bookings.filter(b => b.status === filterStatus);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Bar */}
            <div className="bg-[#131718] text-white px-6 py-4 flex items-center gap-3">
                <Link to="/dashboard" className="text-white/60 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <span className="font-display text-2xl tracking-widest">MY PASSES</span>
            </div>

            <div className="px-6 py-8 max-w-2xl mx-auto">
                {/* Filters */}
                <div className="flex items-center gap-3 mb-6">
                    <Filter size={16} className="text-gray-400" />
                    <div className="flex bg-white border border-gray-200 rounded-2xl p-1 gap-1">
                        {['all', 'active', 'used', 'cancelled'].map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${filterStatus === s ? 'bg-[#131718] text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bookings List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-3xl p-6 h-24 animate-pulse bg-gray-100" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="font-display text-3xl text-gray-200 mb-3">NO PASSES</p>
                        <p className="text-gray-400 text-sm">You haven't booked any passes yet.</p>
                        <Link to="/dashboard" className="mt-4 inline-block bg-[#FEC29F] text-[#131718] px-6 py-3 rounded-full text-sm font-semibold">
                            Book your first pass →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(b => (
                            <div key={b.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                                            <p className="font-semibold text-sm">{b.origin} → {b.destination}</p>
                                        </div>
                                        <p className="text-xs text-gray-400">{new Date(b.booking_date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} · {b.departure_time?.slice(0, 5)} · ₹{b.fare_paid}</p>
                                    </div>
                                    {expandedId === b.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                                </div>

                                {expandedId === b.id && (
                                    <div className="border-t border-gray-100 p-5 flex flex-col items-center gap-4 bg-gray-50">
                                        <div className="grid grid-cols-2 gap-3 w-full text-sm">
                                            <div><p className="text-xs text-gray-400">Bus</p><p className="font-semibold">{b.bus_number}</p></div>
                                            <div><p className="text-xs text-gray-400">Operator</p><p className="font-semibold">{b.operator_name}</p></div>
                                            <div><p className="text-xs text-gray-400">Departure</p><p className="font-semibold">{b.departure_time?.slice(0, 5)}</p></div>
                                            <div><p className="text-xs text-gray-400">Arrival</p><p className="font-semibold">{b.arrival_time?.slice(0, 5)}</p></div>
                                        </div>
                                        {b.status === 'active' && (
                                            <div className="bg-white p-3 rounded-2xl shadow">
                                                <QRCodeSVG value={b.qr_code_token} size={140} />
                                                <p className="text-center text-xs text-gray-400 mt-2 font-mono">{b.qr_code_token?.slice(0, 16)}...</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
