import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../api/client';
import { Bus, Clock, MapPin, CreditCard, Smartphone, CheckCircle, Download, LogOut, Map, History, HelpCircle, ChevronRight } from 'lucide-react';

const STEPS = ['Route', 'Time Slot', 'Payment', 'Your Pass'];

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(0);
    const [cities, setCities] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [slots, setSlots] = useState([]);
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [payMethod, setPayMethod] = useState('upi');
    const [bookingResult, setBookingResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const ticketRef = useRef(null);

    useEffect(() => {
        api.get('/cities').then(r => setCities(r.data));
        api.get('/routes').then(r => setRoutes(r.data));
    }, []);

    useEffect(() => {
        if (selectedRoute) {
            api.get(`/routes/${selectedRoute.id}/slots`).then(r => setSlots(r.data));
        }
    }, [selectedRoute]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const filteredRoutes = routes.filter(r => !selectedCity || r.destination === selectedCity);

    const handleBook = async () => {
        setLoading(true);
        setError('');
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await api.post('/bookings', {
                timeSlotId: selectedSlot.id,
                bookingDate: today,
                paymentMethod: payMethod,
            });
            setBookingResult(res.data);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        if (!ticketRef.current) return;
        const canvas = await html2canvas(ticketRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [150, 200] });
        pdf.addImage(imgData, 'PNG', 10, 10, 130, 180);
        pdf.save(`PassGo-Ticket-${bookingResult.bookingId}.pdf`);
    };

    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-[#131718] text-white p-6 sticky top-0 h-screen">
                <span className="font-display text-2xl tracking-widest mb-8">PASSGO</span>
                <div className="flex-1 space-y-2">
                    {[
                        { icon: <Bus size={18} />, label: 'Book Pass', to: '/dashboard', active: true },
                        { icon: <Map size={18} />, label: 'Live Tracking', to: '/tracking' },
                        { icon: <History size={18} />, label: 'My History', to: '/history' },
                        { icon: <HelpCircle size={18} />, label: 'Support', to: '/support' },
                    ].map(({ icon, label, to, active }) => (
                        <Link key={label} to={to}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'bg-[#FEC29F] text-[#131718]' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
                            {icon} {label}
                        </Link>
                    ))}
                </div>
                <button onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/40 hover:text-white transition-colors">
                    <LogOut size={18} /> Log Out
                </button>
            </aside>

            {/* Main */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                {/* Header */}
                <div className="mb-8">
                    <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#FEC29F] mb-1">{today}</p>
                    <h1 className="font-display text-5xl md:text-6xl text-[#131718]">GOOD DAY, {user?.name?.split(' ')[0]?.toUpperCase()}.</h1>
                    <p className="text-gray-500 mt-2">Book your bus pass using the steps below.</p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-0 mb-10">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex items-center flex-1 last:flex-none">
                            <div className={`flex items-center gap-2 ${i <= step ? 'text-[#131718]' : 'text-gray-300'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? 'bg-[#131718] text-white' : i === step ? 'bg-[#FEC29F] text-[#131718]' : 'bg-gray-200 text-gray-400'}`}>
                                    {i < step ? '✓' : i + 1}
                                </div>
                                <span className="hidden sm:block text-xs font-semibold">{s}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-3 transition-all ${i < step ? 'bg-[#131718]' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* STEP 0: Route Selection */}
                {step === 0 && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Destination City</label>
                            <select value={selectedCity} onChange={e => { setSelectedCity(e.target.value); setSelectedRoute(null); }}
                                className="w-full max-w-sm border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none appearance-none bg-white">
                                <option value="">All Cities</option>
                                {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredRoutes.map(route => (
                                <div key={route.id} onClick={() => setSelectedRoute(route)}
                                    className={`cursor-pointer rounded-3xl p-6 border-2 transition-all hover:shadow-md ${selectedRoute?.id === route.id ? 'border-[#131718] bg-[#FFF6C6]' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin size={16} className="text-[#FEC29F]" />
                                        <span className="text-xs font-semibold text-gray-400 uppercase">Route</span>
                                    </div>
                                    <p className="font-display text-2xl mb-1">{route.destination}</p>
                                    <p className="text-xs text-gray-400 mb-4">from {route.origin}</p>
                                    <div className="flex gap-4 text-xs text-gray-500 font-medium">
                                        <span>🚌 {route.distance_km}km</span>
                                        <span>⏱ ~{route.estimated_duration_mins} min</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredRoutes.length === 0 && (
                            <p className="text-gray-400 text-sm">No routes found.</p>
                        )}

                        <button disabled={!selectedRoute} onClick={() => setStep(1)}
                            className="flex items-center gap-2 bg-[#131718] text-white px-8 py-4 rounded-full font-semibold disabled:opacity-30 hover:bg-[#FEC29F] hover:text-[#131718] transition-all disabled:hover:bg-[#131718] disabled:hover:text-white">
                            Next: Pick Time Slot <ChevronRight size={16} />
                        </button>
                    </div>
                )}

                {/* STEP 1: Time Slot */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="bg-[#D1E6F6] rounded-3xl p-5 inline-block">
                            <p className="font-display text-2xl">{selectedRoute?.destination}</p>
                            <p className="text-xs text-gray-600">from {selectedRoute?.origin}</p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {slots.map(slot => (
                                <div key={slot.id} onClick={() => setSelectedSlot(slot)}
                                    className={`cursor-pointer rounded-3xl p-6 border-2 transition-all hover:shadow-md ${selectedSlot?.id === slot.id ? 'border-[#131718] bg-[#FFF6C6]' : 'border-gray-200 bg-white'}`}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Clock size={16} className="text-[#FEC29F]" />
                                        <span className="text-xs font-semibold text-gray-400 uppercase">Departure</span>
                                    </div>
                                    <p className="font-display text-3xl mb-1">{slot.departure_time?.slice(0, 5)}</p>
                                    <p className="text-xs text-gray-400 mb-4">Arrives {slot.arrival_time?.slice(0, 5)}</p>
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-gray-500">🚌 {slot.bus_number}</span>
                                        <span className={slot.available_seats > 10 ? 'text-green-600' : 'text-orange-500'}>
                                            {slot.available_seats} seats left
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {slots.length === 0 && <p className="text-gray-400 text-sm">No slots available for this route.</p>}

                        <div className="flex gap-3">
                            <button onClick={() => setStep(0)}
                                className="px-8 py-4 rounded-full border-2 border-gray-200 font-semibold text-sm hover:border-[#131718] transition-all">
                                ← Back
                            </button>
                            <button disabled={!selectedSlot} onClick={() => setStep(2)}
                                className="flex items-center gap-2 bg-[#131718] text-white px-8 py-4 rounded-full font-semibold disabled:opacity-30 hover:bg-[#FEC29F] hover:text-[#131718] transition-all">
                                Next: Payment <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: Payment */}
                {step === 2 && (
                    <div className="max-w-md space-y-6">
                        {/* Order Summary */}
                        <div className="bg-[#131718] text-white rounded-3xl p-6">
                            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Order Summary</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-gray-400">Route</span><span>{selectedRoute?.destination}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Departure</span><span>{selectedSlot?.departure_time?.slice(0, 5)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Arrival</span><span>{selectedSlot?.arrival_time?.slice(0, 5)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Bus</span><span>{selectedSlot?.bus_number}</span></div>
                                <div className="border-t border-white/20 my-3" />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total Fare</span>
                                    <span className="text-[#FEC29F]">₹25.00</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method Tabs */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Payment Method</p>
                            <div className="flex bg-gray-100 rounded-2xl p-1 mb-4">
                                {[['card', <CreditCard size={14} key="c" />, 'Card'], ['upi', <Smartphone size={14} key="u" />, 'UPI']].map(([m, icon, label]) => (
                                    <button key={m} onClick={() => setPayMethod(m)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${payMethod === m ? 'bg-[#131718] text-white' : 'text-gray-500'}`}>
                                        {icon} {label}
                                    </button>
                                ))}
                            </div>

                            {payMethod === 'card' ? (
                                <div className="space-y-3">
                                    <input placeholder="Card Number (mock)" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none" />
                                    <div className="flex gap-3">
                                        <input placeholder="MM/YY" className="w-1/2 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none" />
                                        <input placeholder="CVV" className="w-1/2 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none" />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 bg-gray-50 rounded-2xl p-6">
                                    {/* Mock QR */}
                                    <div className="bg-white p-3 rounded-xl shadow">
                                        <QRCodeSVG value="upi://pay?pa=passgo@upi&pn=PassGo&am=25&tn=BusPass" size={140} />
                                    </div>
                                    <p className="text-xs text-gray-500 text-center">Scan with any UPI app to pay ₹25</p>
                                    <p className="text-xs font-mono text-gray-400">passgo@upi</p>
                                </div>
                            )}
                        </div>

                        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

                        <div className="flex gap-3">
                            <button onClick={() => setStep(1)}
                                className="px-8 py-4 rounded-full border-2 border-gray-200 font-semibold text-sm hover:border-[#131718] transition-all">
                                ← Back
                            </button>
                            <button onClick={handleBook} disabled={loading}
                                className="flex-1 bg-[#FEC29F] text-[#131718] py-4 rounded-full font-bold text-sm hover:bg-[#131718] hover:text-white transition-all disabled:opacity-50">
                                {loading ? 'Processing...' : 'Confirm & Pay ₹25 →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: Digital Pass */}
                {step === 3 && bookingResult && (
                    <div className="max-w-sm mx-auto space-y-6">
                        <div className="text-center">
                            <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                            <p className="font-display text-4xl text-[#131718]">PASS CONFIRMED!</p>
                            <p className="text-gray-400 text-sm mt-1">Your ticket is ready to show.</p>
                        </div>

                        {/* Ticket */}
                        <div ref={ticketRef} className="bg-[#131718] rounded-3xl p-6 text-white">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="font-display text-3xl">PASSGO</p>
                                    <p className="text-xs text-gray-400">Bus Pass | VJEC</p>
                                </div>
                                <div className="bg-[#FEC29F] text-[#131718] text-xs font-bold px-3 py-1 rounded-full">ACTIVE</div>
                            </div>

                            <div className="space-y-3 text-sm mb-6">
                                <div className="flex justify-between"><span className="text-gray-400">Name</span><span>{user?.name}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Student ID</span><span>{user?.student_id || 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Route</span><span>{selectedRoute?.destination}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Departure</span><span>{selectedSlot?.departure_time?.slice(0, 5)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Bus</span><span>{selectedSlot?.bus_number}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Fare</span><span className="text-[#FEC29F] font-bold">₹25 Paid</span></div>
                            </div>

                            <div className="border-t border-white/20 pt-4 flex justify-center">
                                <div className="bg-white p-3 rounded-xl">
                                    <QRCodeSVG value={bookingResult.qrToken} size={120} />
                                </div>
                            </div>
                            <p className="text-center text-xs text-gray-400 mt-3 font-mono break-all">{bookingResult.qrToken?.slice(0, 20)}...</p>
                        </div>

                        <button onClick={downloadPDF}
                            className="w-full flex items-center justify-center gap-2 border-2 border-[#131718] text-[#131718] py-4 rounded-full font-semibold hover:bg-[#131718] hover:text-white transition-all">
                            <Download size={16} /> Download PDF
                        </button>

                        <button onClick={() => { setStep(0); setSelectedRoute(null); setSelectedSlot(null); setBookingResult(null); }}
                            className="w-full bg-[#FEC29F] text-[#131718] py-4 rounded-full font-semibold hover:bg-[#131718] hover:text-white transition-all">
                            Book Another Pass
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
