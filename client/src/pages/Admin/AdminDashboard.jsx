import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    LayoutDashboard, Bus, BookOpen, Users, FileText, Bell, Settings,
    LogOut, Plus, Trash2, X, Check, AlertTriangle, Download, Send
} from 'lucide-react';

const NAV_ITEMS = [
    { id: 'stats', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { id: 'buses', icon: <Bus size={18} />, label: 'Bus Management' },
    { id: 'bookings', icon: <BookOpen size={18} />, label: 'Bookings' },
    { id: 'students', icon: <Users size={18} />, label: 'Students' },
    { id: 'reports', icon: <FileText size={18} />, label: 'Reports' },
    { id: 'notifications', icon: <Bell size={18} />, label: 'Notifications' },
    { id: 'system', icon: <Settings size={18} />, label: 'System', superOnly: true },
];

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [section, setSection] = useState('stats');

    // Stats
    const [stats, setStats] = useState(null);

    // Buses
    const [buses, setBuses] = useState([]);
    const [showAddBus, setShowAddBus] = useState(false);
    const [busForm, setBusForm] = useState({ busNumber: '', operatorName: '', capacity: '' });
    const [busFile, setBusFile] = useState(null);

    // Students
    const [students, setStudents] = useState([]);
    const [flagModal, setFlagModal] = useState(null);
    const [flagReason, setFlagReason] = useState('');

    // Notifications
    const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'announcement' });
    const [notifSent, setNotifSent] = useState(false);
    const [sentNotifs, setSentNotifs] = useState([]);

    // Fare
    const [fare, setFare] = useState(25);
    const [newFare, setNewFare] = useState(25);

    useEffect(() => {
        if (!user) { navigate('/auth'); return; }
        loadStats();
        loadBuses();
        loadStudents();
    }, [user]);

    const loadStats = () => api.get('/admin/stats').then(r => setStats(r.data)).catch(() => { });
    const loadBuses = () => api.get('/admin/buses').then(r => setBuses(r.data)).catch(() => { });
    const loadStudents = () => api.get('/admin/students').then(r => setStudents(r.data)).catch(() => { });

    const handleAddBus = async () => {
        const fd = new FormData();
        Object.entries(busForm).forEach(([k, v]) => fd.append(k, v));
        if (busFile) fd.append('image', busFile);
        await api.post('/admin/buses', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setShowAddBus(false); setBusForm({ busNumber: '', operatorName: '', capacity: '' }); loadBuses();
    };

    const handleDeleteBus = async (id) => {
        if (!confirm('Delete this bus?')) return;
        await api.delete(`/admin/buses/${id}`); loadBuses();
    };

    const handleToggleStudent = async (id, isActive) => {
        await api.patch(`/admin/students/${id}/toggle`, { isActive }); loadStudents();
    };

    const handleFlagStudent = async () => {
        await api.post(`/admin/students/${flagModal}/flag`, { reason: flagReason });
        setFlagModal(null); setFlagReason(''); loadStudents();
    };

    const handleSendNotif = async () => {
        await api.post('/admin/notifications', notifForm);
        setSentNotifs(n => [{ ...notifForm, sentAt: new Date().toLocaleString() }, ...n]);
        setNotifSent(true);
        setTimeout(() => setNotifSent(false), 3000);
        setNotifForm({ title: '', message: '', type: 'announcement' });
    };

    const exportCSV = (data, filename) => {
        if (!data || data.length === 0) return alert('No data to export.');
        const cols = Object.keys(data[0]);
        const csv = [cols.join(','), ...data.map(row => cols.map(c => `"${row[c]}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
    };

    const handleFareUpdate = async () => {
        await api.patch('/admin/fare', { flatFare: newFare });
        setFare(newFare);
        alert('Fare updated successfully!');
    };

    const navItems = NAV_ITEMS.filter(n => !n.superOnly || user?.role === 'superadmin');

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-[#131718] text-white flex flex-col sticky top-0 h-screen">
                <div className="p-6 border-b border-white/10">
                    <p className="font-display text-2xl tracking-widest">PASSGO</p>
                    <p className="text-xs text-gray-400 mt-1 capitalize">{user?.role} Panel</p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map(({ id, icon, label }) => (
                        <button key={id} onClick={() => setSection(id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${section === id ? 'bg-[#FEC29F] text-[#131718]' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
                            {icon} {label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#FEC29F] flex items-center justify-center text-[#131718] font-bold text-sm">
                            {user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{user?.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button onClick={async () => { await logout(); navigate('/'); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/40 hover:text-white transition-colors">
                        <LogOut size={16} /> Log Out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">

                    {/* ── Section 1: Stats ── */}
                    {section === 'stats' && (
                        <div className="space-y-8">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-[#FEC29F] mb-1">Overview</p>
                                <h1 className="font-display text-5xl text-[#131718]">DASHBOARD</h1>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-4">
                                {[
                                    { label: 'Total Bookings', value: stats?.totalBookings ?? '—', bg: '#D1E6F6' },
                                    { label: 'Total Revenue', value: stats?.totalRevenue ? `₹${Number(stats.totalRevenue).toFixed(0)}` : '—', bg: '#FEC29F' },
                                    { label: 'Active Passes', value: stats?.activePasses ?? '—', bg: '#FFDAE4' },
                                ].map(({ label, value, bg }) => (
                                    <div key={label} className="rounded-3xl p-6" style={{ backgroundColor: bg }}>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">{label}</p>
                                        <p className="font-display text-5xl text-[#131718]">{value}</p>
                                    </div>
                                ))}
                            </div>

                            {stats?.chartData?.length > 0 && (
                                <div className="bg-white rounded-3xl p-6 border border-gray-100">
                                    <p className="font-semibold text-sm mb-4">Bookings (Last 7 Days)</p>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={stats.chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Bar dataKey="passes" fill="#FEC29F" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Section 2: Bus Management ── */}
                    {section === 'buses' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h1 className="font-display text-4xl text-[#131718]">BUS MANAGEMENT</h1>
                                <button onClick={() => setShowAddBus(true)}
                                    className="flex items-center gap-2 bg-[#131718] text-white px-5 py-3 rounded-full text-sm font-semibold hover:bg-[#FEC29F] hover:text-[#131718] transition-all">
                                    <Plus size={16} /> Add Bus
                                </button>
                            </div>

                            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            {['Bus Number', 'Operator', 'Capacity', 'Status', ''].map(h => (
                                                <th key={h} className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {buses.map(bus => (
                                            <tr key={bus.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-4 font-semibold">{bus.bus_number}</td>
                                                <td className="px-5 py-4 text-gray-500">{bus.operator_name}</td>
                                                <td className="px-5 py-4 text-gray-500">{bus.capacity} seats</td>
                                                <td className="px-5 py-4">
                                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${bus.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
                                                        {bus.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <button onClick={() => handleDeleteBus(bus.id)} className="text-red-400 hover:text-red-600 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {buses.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">No buses found.</p>}
                            </div>

                            {/* Add Bus Modal */}
                            {showAddBus && (
                                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
                                        <div className="flex justify-between items-center mb-5">
                                            <h2 className="font-display text-2xl">ADD BUS</h2>
                                            <button onClick={() => setShowAddBus(false)}><X size={20} /></button>
                                        </div>
                                        <div className="space-y-3">
                                            {[['Bus Number', 'busNumber', 'KL-58-X-0000'], ['Operator', 'operatorName', 'VJEC Transport'], ['Capacity', 'capacity', '50']].map(([label, key, ph]) => (
                                                <div key={key}>
                                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">{label}</label>
                                                    <input value={busForm[key]} onChange={e => setBusForm(f => ({ ...f, [key]: e.target.value }))}
                                                        placeholder={ph} type={key === 'capacity' ? 'number' : 'text'}
                                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none" />
                                                </div>
                                            ))}
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Bus Image</label>
                                                <input type="file" accept="image/*" onChange={e => setBusFile(e.target.files[0])}
                                                    className="w-full text-sm text-gray-500" />
                                            </div>
                                        </div>
                                        <div className="flex gap-3 mt-5">
                                            <button onClick={() => setShowAddBus(false)}
                                                className="flex-1 border-2 border-gray-200 py-3 rounded-full font-semibold text-sm">Cancel</button>
                                            <button onClick={handleAddBus}
                                                className="flex-1 bg-[#131718] text-white py-3 rounded-full font-semibold text-sm hover:bg-[#FEC29F] hover:text-[#131718] transition-all">
                                                Add Bus
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Section 3: Bookings ── */}
                    {section === 'bookings' && (
                        <div className="space-y-6">
                            <h1 className="font-display text-4xl text-[#131718]">ALL BOOKINGS</h1>
                            <div className="bg-[#FFF6C6] rounded-2xl p-4 text-sm font-medium text-gray-600">
                                Booking management table — search, filter, and verify passes using the backend data.
                            </div>
                        </div>
                    )}

                    {/* ── Section 4: Students ── */}
                    {section === 'students' && (
                        <div className="space-y-6">
                            <h1 className="font-display text-4xl text-[#131718]">STUDENT MANAGEMENT</h1>

                            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            {['Name', 'Student ID', 'Email', 'Status', 'Actions'].map(h => (
                                                <th key={h} className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {students.map(s => (
                                            <tr key={s.id} className="hover:bg-gray-50">
                                                <td className="px-5 py-4 font-semibold">{s.name}</td>
                                                <td className="px-5 py-4 text-gray-500">{s.student_id || '—'}</td>
                                                <td className="px-5 py-4 text-gray-500">{s.email}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                        {s.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleToggleStudent(s.id, !s.is_active)}
                                                            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${s.is_active ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}>
                                                            {s.is_active ? 'Deactivate' : 'Reactivate'}
                                                        </button>
                                                        <button onClick={() => { setFlagModal(s.id); setFlagReason(''); }}
                                                            className="text-xs px-3 py-1.5 rounded-full font-semibold bg-red-100 hover:bg-red-200 text-red-600 transition-all flex items-center gap-1">
                                                            <AlertTriangle size={12} /> Flag
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {students.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">No students found.</p>}
                            </div>

                            {/* Flag Modal */}
                            {flagModal && (
                                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
                                        <h2 className="font-display text-2xl mb-4">FLAG STUDENT</h2>
                                        <p className="text-sm text-gray-500 mb-4">This will deactivate the account and notify the student via email.</p>
                                        <textarea value={flagReason} onChange={e => setFlagReason(e.target.value)} rows={3} placeholder="Reason for flagging..."
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-red-400 focus:outline-none resize-none mb-4" />
                                        <div className="flex gap-3">
                                            <button onClick={() => setFlagModal(null)} className="flex-1 border-2 border-gray-200 py-3 rounded-full font-semibold text-sm">Cancel</button>
                                            <button onClick={handleFlagStudent} disabled={!flagReason.trim()}
                                                className="flex-1 bg-red-500 text-white py-3 rounded-full font-semibold text-sm hover:bg-red-600 disabled:opacity-40">
                                                Confirm Flag
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Section 5: Reports ── */}
                    {section === 'reports' && (
                        <div className="space-y-6">
                            <h1 className="font-display text-4xl text-[#131718]">REPORTS & EXPORTS</h1>
                            <div className="grid sm:grid-cols-3 gap-4">
                                {[
                                    { label: 'Daily Bookings', desc: 'All bookings with pass details', filename: 'bookings.csv', getData: () => [] },
                                    { label: 'Revenue Report', desc: 'Total fares collected by date', filename: 'revenue.csv', getData: () => [] },
                                    { label: 'Flagged Users', desc: 'Students with flagged accounts', filename: 'flagged.csv', getData: () => students.filter(s => !s.is_active) },
                                ].map(({ label, desc, filename, getData }) => (
                                    <div key={label} className="bg-white rounded-3xl p-6 border border-gray-100">
                                        <p className="font-display text-2xl mb-2">{label}</p>
                                        <p className="text-sm text-gray-400 mb-4">{desc}</p>
                                        <button onClick={() => exportCSV(getData(), filename)}
                                            className="flex items-center gap-2 bg-[#131718] text-white px-5 py-3 rounded-full text-xs font-semibold hover:bg-[#FEC29F] hover:text-[#131718] transition-all w-full justify-center">
                                            <Download size={14} /> Export CSV
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Section 6: Notifications ── */}
                    {section === 'notifications' && (
                        <div className="space-y-6 max-w-2xl">
                            <h1 className="font-display text-4xl text-[#131718]">SEND NOTIFICATION</h1>

                            <div className="bg-white rounded-3xl p-6 border border-gray-100 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Title</label>
                                    <input value={notifForm.title} onChange={e => setNotifForm(f => ({ ...f, title: e.target.value }))}
                                        placeholder="e.g. Bus Delay on Route 3"
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Message</label>
                                    <textarea value={notifForm.message} onChange={e => setNotifForm(f => ({ ...f, message: e.target.value }))}
                                        rows={4} placeholder="Write your message to all students..."
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none resize-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Type</label>
                                    <select value={notifForm.type} onChange={e => setNotifForm(f => ({ ...f, type: e.target.value }))}
                                        className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none bg-white">
                                        <option value="announcement">📢 Announcement</option>
                                        <option value="delay">⚠️ Delay Alert</option>
                                        <option value="maintenance">🔧 Maintenance</option>
                                    </select>
                                </div>
                                {notifSent && <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-3">✓ Notification sent to all students!</div>}
                                <button onClick={handleSendNotif} disabled={!notifForm.title || !notifForm.message}
                                    className="flex items-center gap-2 bg-[#131718] text-white px-8 py-4 rounded-full font-semibold text-sm hover:bg-[#FEC29F] hover:text-[#131718] transition-all disabled:opacity-40">
                                    <Send size={16} /> Send to All Students
                                </button>
                            </div>

                            {/* Sent Log */}
                            {sentNotifs.length > 0 && (
                                <div className="space-y-3">
                                    <p className="font-semibold text-sm text-gray-500 uppercase tracking-wider">Sent Log</p>
                                    {sentNotifs.map((n, i) => (
                                        <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 text-sm">
                                            <div className="flex justify-between">
                                                <p className="font-semibold">{n.title}</p>
                                                <span className="text-xs text-gray-400">{n.sentAt}</span>
                                            </div>
                                            <p className="text-gray-500 mt-1">{n.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Section 7: System Config (Super Admin) ── */}
                    {section === 'system' && user?.role === 'superadmin' && (
                        <div className="space-y-8 max-w-2xl">
                            <h1 className="font-display text-4xl text-[#131718]">SYSTEM CONFIG</h1>

                            {/* Flat Fare Editor */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100">
                                <p className="font-display text-2xl mb-4">FLAT FARE EDITOR</p>
                                <div className="flex items-center gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Current Fare (₹)</label>
                                        <p className="font-display text-4xl text-[#FEC29F]">₹{fare}</p>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">New Fare (₹)</label>
                                        <input type="number" value={newFare} onChange={e => setNewFare(Number(e.target.value))}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none" />
                                    </div>
                                    <button onClick={handleFareUpdate}
                                        className="mt-6 bg-[#131718] text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#FEC29F] hover:text-[#131718] transition-all">
                                        Update
                                    </button>
                                </div>
                            </div>

                            {/* City & Route Management */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100">
                                <p className="font-display text-2xl mb-4">CITY & ROUTE MANAGEMENT</p>
                                <div className="space-y-3">
                                    <div className="flex gap-3">
                                        <input placeholder="City Name" id="cityNameInput"
                                            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none" />
                                        <button onClick={async () => {
                                            const name = document.getElementById('cityNameInput').value;
                                            if (!name) return;
                                            await api.post('/admin/cities', { name, description: '' });
                                            alert('City added!');
                                        }} className="bg-[#131718] text-white px-5 py-3 rounded-full text-sm font-semibold whitespace-nowrap">
                                            + Add City
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
