import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Bus, Clock, MapPin, AlertCircle } from 'lucide-react';

// Fix Leaflet icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// VJEC Chemberi coordinates
const VJEC = { lat: 11.9333, lng: 75.7167 };

// Mock bus positions within ~20km of VJEC
const MOCK_BUSES = [
    { id: 1, busNumber: 'KL-58-A-1111', route: 'VJEC → Kannur', status: 'On Route', lat: 11.9800, lng: 75.7400, eta: '18 min', speed: '45 km/h', nextStop: 'Iritty', passengers: 32 },
    { id: 2, busNumber: 'KL-58-A-2222', route: 'VJEC → Thalassery', status: 'On Route', lat: 11.9100, lng: 75.7600, eta: '25 min', speed: '38 km/h', nextStop: 'Kuthuparambu', passengers: 28 },
    { id: 3, busNumber: 'KL-58-A-3333', route: 'VJEC → Payyanur', status: 'At Stop', lat: 11.9550, lng: 75.6900, eta: '5 min', speed: '0 km/h', nextStop: 'Payyanur Town', passengers: 45 },
    { id: 4, busNumber: 'KL-58-B-4444', route: 'VJEC → Iritty', status: 'On Route', lat: 11.9200, lng: 75.7900, eta: '12 min', speed: '52 km/h', nextStop: 'Iritty', passengers: 18 },
    { id: 5, busNumber: 'KL-58-B-5555', route: 'VJEC → Mattannur', status: 'Departing', lat: 11.9370, lng: 75.7200, eta: '2 min', speed: '10 km/h', nextStop: 'Mattannur', passengers: 40 },
    { id: 6, busNumber: 'KL-58-B-6666', route: 'VJEC → Taliparamba', status: 'On Route', lat: 11.9450, lng: 75.6700, eta: '30 min', speed: '50 km/h', nextStop: 'Taliparamba', passengers: 22 },
];

// Custom icons
const busIcon = (status) => L.divIcon({
    html: `<div style="width:36px;height:36px;border-radius:50%;background:${status === 'At Stop' ? '#FEC29F' : status === 'Departing' ? '#FFF6C6' : '#D1E6F6'};display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #131718;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🚌</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    className: '',
});

const collegeIcon = L.divIcon({
    html: `<div style="width:40px;height:40px;border-radius:50%;background:#131718;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)">🏫</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    className: '',
});

const cityIcon = L.divIcon({
    html: `<div style="width:32px;height:32px;border-radius:50%;background:#FFDAE4;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #131718;">📍</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: '',
});

// City destinations (~20-50km out, shown for reference)
const CITIES = [
    { name: 'Kannur', lat: 11.8745, lng: 75.3704 },
    { name: 'Thalassery', lat: 11.7491, lng: 75.4901 },
    { name: 'Payyanur', lat: 12.0979, lng: 75.1993 },
    { name: 'Iritty', lat: 11.9975, lng: 75.7478 },
    { name: 'Mattannur', lat: 11.9280, lng: 75.5700 },
    { name: 'Taliparamba', lat: 12.0395, lng: 75.3513 },
];

function AnimatedBus({ bus }) {
    const [pos, setPos] = useState({ lat: bus.lat, lng: bus.lng });

    useEffect(() => {
        const interval = setInterval(() => {
            setPos(p => ({
                lat: p.lat + (Math.random() - 0.5) * 0.0015,
                lng: p.lng + (Math.random() - 0.5) * 0.0015,
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Marker position={[pos.lat, pos.lng]} icon={busIcon(bus.status)}>
            <Popup>
                <div className="font-sans text-sm min-w-[160px]">
                    <p className="font-bold text-[#131718] mb-1">{bus.busNumber}</p>
                    <p className="text-xs text-gray-500 mb-2">{bus.route}</p>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-gray-400">Status</span><span className="font-semibold">{bus.status}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">ETA</span><span className="font-semibold text-green-600">{bus.eta}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Speed</span><span>{bus.speed}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Next Stop</span><span>{bus.nextStop}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Passengers</span><span>{bus.passengers}</span></div>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
}

export default function LiveTracking() {
    const [selectedBus, setSelectedBus] = useState(MOCK_BUSES[0]);
    const [drawerOpen, setDrawerOpen] = useState(true);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Bar */}
            <div className="bg-[#131718] text-white px-6 py-4 flex items-center justify-between z-10 relative">
                <div className="flex items-center gap-3">
                    <Link to="/dashboard" className="text-white/60 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <span className="font-display text-2xl tracking-widest">LIVE TRACKING</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                    <span className="text-gray-400">6 buses active</span>
                </div>
            </div>

            <div className="flex flex-1 relative overflow-hidden">
                {/* Map */}
                <div className="flex-1 relative z-0">
                    <MapContainer
                        center={[VJEC.lat, VJEC.lng]}
                        zoom={12}
                        style={{ height: '100%', width: '100%', minHeight: '400px' }}
                    >
                        <TileLayer
                            attribution='&copy; OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* 20km radius circle from VJEC */}
                        <Circle
                            center={[VJEC.lat, VJEC.lng]}
                            radius={20000}
                            pathOptions={{ color: '#FEC29F', fillColor: '#FEC29F', fillOpacity: 0.05, weight: 2, dashArray: '6 4' }}
                        />

                        {/* College marker */}
                        <Marker position={[VJEC.lat, VJEC.lng]} icon={collegeIcon}>
                            <Popup>
                                <div className="font-sans text-sm">
                                    <p className="font-bold text-[#131718]">Vimal Jyothi Engineering College</p>
                                    <p className="text-xs text-gray-500">Chemberi, Kannur</p>
                                    <p className="text-xs text-gray-400 mt-1">Bus Terminal</p>
                                </div>
                            </Popup>
                        </Marker>

                        {/* City markers */}
                        {CITIES.map(city => (
                            <Marker key={city.name} position={[city.lat, city.lng]} icon={cityIcon}>
                                <Popup><div className="font-sans text-sm font-bold">{city.name}</div></Popup>
                            </Marker>
                        ))}

                        {/* Animated bus markers */}
                        {MOCK_BUSES.map(bus => (
                            <AnimatedBus key={bus.id} bus={bus} />
                        ))}
                    </MapContainer>
                </div>

                {/* Desktop Sidebar Panel */}
                <aside className="hidden lg:flex flex-col w-80 bg-white shadow-xl overflow-y-auto z-10">
                    <div className="p-5 border-b">
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Active Buses</p>
                        <p className="font-display text-2xl">SELECT A BUS</p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {MOCK_BUSES.map(bus => (
                            <button key={bus.id} onClick={() => setSelectedBus(bus)}
                                className={`w-full text-left p-5 border-b transition-all hover:bg-gray-50 ${selectedBus?.id === bus.id ? 'bg-[#FFF6C6] border-l-4 border-l-[#FEC29F]' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-semibold text-sm">{bus.busNumber}</p>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${bus.status === 'At Stop' ? 'bg-orange-100 text-orange-600' : bus.status === 'Departing' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-600'}`}>
                                        {bus.status}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">{bus.route}</p>
                                <div className="flex gap-3 text-xs text-gray-400">
                                    <span className="flex items-center gap-1"><Clock size={10} />ETA: <strong className="text-green-600">{bus.eta}</strong></span>
                                    <span>{bus.passengers} pax</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Selected Bus Info */}
                    {selectedBus && (
                        <div className="p-5 bg-[#131718] text-white">
                            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Selected Bus</p>
                            <p className="font-display text-2xl mb-3">{selectedBus.busNumber}</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-gray-400">Route</span><span>{selectedBus.route}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">ETA</span><span className="text-[#FEC29F]">{selectedBus.eta}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Speed</span><span>{selectedBus.speed}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Next Stop</span><span>{selectedBus.nextStop}</span></div>
                            </div>
                        </div>
                    )}
                </aside>
            </div>

            {/* Mobile Bottom Drawer */}
            <div className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-20 transition-transform ${drawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%-60px)]'}`}>
                <div className="flex flex-col items-center pt-3 cursor-pointer" onClick={() => setDrawerOpen(o => !o)}>
                    <div className="w-12 h-1 rounded-full bg-gray-200 mb-3" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 pb-2">Bus Info</p>
                </div>
                {selectedBus && (
                    <div className="px-6 pb-8">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="font-semibold">{selectedBus.busNumber}</p>
                                <p className="text-xs text-gray-500">{selectedBus.route}</p>
                            </div>
                            <span className="text-xs bg-green-100 text-green-600 font-semibold px-3 py-1 rounded-full">{selectedBus.status}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[['ETA', selectedBus.eta, '#D1E6F6'], ['Speed', selectedBus.speed.split(' ')[0] + 'km/h', '#FFF6C6'], ['Pax', selectedBus.passengers + ' aboard', '#FFDAE4']].map(([k, v, bg]) => (
                                <div key={k} className="rounded-2xl p-3 text-center" style={{ backgroundColor: bg }}>
                                    <p className="text-xs text-gray-500">{k}</p>
                                    <p className="font-display text-lg">{v}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="px-6 pb-4 overflow-x-auto flex gap-3">
                    {MOCK_BUSES.map(bus => (
                        <button key={bus.id} onClick={() => setSelectedBus(bus)}
                            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${selectedBus?.id === bus.id ? 'bg-[#131718] text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {bus.busNumber}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
