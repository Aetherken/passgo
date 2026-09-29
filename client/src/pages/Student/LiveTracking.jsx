import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Clock } from 'lucide-react';
import api from '../../api/client';

// Fix Leaflet icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// VJEC Chemberi exact coordinates at Chelimparamba (12.0965° N, 75.5685° E)
const VJEC = { lat: 12.0965, lng: 75.5685 };

// Pre-known coordinates for Kannur towns
const KNOWN_COORDS = {
    'Kannur': { lat: 11.8745, lng: 75.3704 },
    'Thalassery': { lat: 11.7491, lng: 75.4901 },
    'Payyanur': { lat: 12.0979, lng: 75.1993 },
    'Iritty': { lat: 11.9806, lng: 75.6625 },
    'Mattannur': { lat: 11.9280, lng: 75.5700 },
    'Taliparamba': { lat: 12.0395, lng: 75.3513 },
    'Sreekandapuram': { lat: 12.0372, lng: 75.5186 },
    'Alakode': { lat: 12.1812, lng: 75.5487 },
    'Chemperi': { lat: 12.0965, lng: 75.5685 },
    'Chelimparamba': { lat: 12.0965, lng: 75.5685 },
    'Kunnoth': { lat: 11.9850, lng: 75.7100 },
    'Kuppom': { lat: 12.0620, lng: 75.3850 },
    'Peravoor': { lat: 11.8950, lng: 75.8050 },
};

// Real bus positions along routes radiating directly from Chelimparamba VJEC
const MOCK_BUSES = [
    { id: 1, busNumber: 'KL-58-A-1111', route: 'VJEC → Kannur', status: 'On Route', lat: 12.0372, lng: 75.5186, eta: '22 min', speed: '45 km/h', nextStop: 'Sreekandapuram', passengers: 32 },
    { id: 2, busNumber: 'KL-58-A-2222', route: 'VJEC → Thalassery', status: 'On Route', lat: 11.9840, lng: 75.5450, eta: '35 min', speed: '38 km/h', nextStop: 'Irikkur', passengers: 28 },
    { id: 3, busNumber: 'KL-58-A-3333', route: 'VJEC → Payyanur', status: 'At Stop', lat: 12.0950, lng: 75.4200, eta: '10 min', speed: '0 km/h', nextStop: 'Tadikkadavu', passengers: 45 },
    { id: 4, busNumber: 'KL-58-B-4444', route: 'VJEC → Iritty', status: 'On Route', lat: 12.0450, lng: 75.6400, eta: '15 min', speed: '52 km/h', nextStop: 'Payyavoor', passengers: 18 },
    { id: 5, busNumber: 'KL-58-B-5555', route: 'VJEC → Mattannur', status: 'Departing', lat: 12.0965, lng: 75.5685, eta: '3 min', speed: '12 km/h', nextStop: 'Chelimparamba Gate', passengers: 40 },
    { id: 6, busNumber: 'KL-58-B-6666', route: 'VJEC → Taliparamba', status: 'On Route', lat: 12.0650, lng: 75.4800, eta: '20 min', speed: '50 km/h', nextStop: 'Karimbam', passengers: 22 },
];

// Dynamic bus icon with highlight state
const busIcon = (status, isSelected) => L.divIcon({
    html: `<div style="
        width:${isSelected ? '48px' : '36px'};
        height:${isSelected ? '48px' : '36px'};
        border-radius:50%;
        background:${isSelected ? '#FF5722' : status === 'At Stop' ? '#FEC29F' : status === 'Departing' ? '#FFF6C6' : '#D1E6F6'};
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:${isSelected ? '24px' : '18px'};
        border:${isSelected ? '4px solid #131718' : '3px solid #131718'};
        box-shadow:${isSelected ? '0 0 20px rgba(255, 87, 34, 0.9), 0 4px 12px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.3)'};
        transition: all 0.3s ease;
        transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
    ">🚌</div>`,
    iconSize: [isSelected ? 48 : 36, isSelected ? 48 : 36],
    iconAnchor: [isSelected ? 24 : 18, isSelected ? 24 : 18],
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

// City destinations in Kannur District relative to VJEC Chemperi
const DEFAULT_CITIES = [
    { name: 'Kannur', lat: 11.8745, lng: 75.3704 },
    { name: 'Thalassery', lat: 11.7491, lng: 75.4901 },
    { name: 'Payyanur', lat: 12.0979, lng: 75.1993 },
    { name: 'Iritty', lat: 11.9806, lng: 75.6625 },
    { name: 'Mattannur', lat: 11.9280, lng: 75.5700 },
    { name: 'Taliparamba', lat: 12.0395, lng: 75.3513 },
    { name: 'Sreekandapuram', lat: 12.0372, lng: 75.5186 },
    { name: 'Alakode', lat: 12.1812, lng: 75.5487 },
];

function MapController({ selectedBus }) {
    const map = useMap();
    useEffect(() => {
        if (selectedBus && selectedBus.lat && selectedBus.lng) {
            map.flyTo([selectedBus.lat, selectedBus.lng], 13, { duration: 1.2 });
        }
    }, [selectedBus, map]);
    return null;
}

function AnimatedBus({ bus, isSelected, onClick }) {
    const [pos, setPos] = useState({ lat: bus.lat, lng: bus.lng });

    useEffect(() => {
        setPos({ lat: bus.lat, lng: bus.lng });
    }, [bus.lat, bus.lng]);

    useEffect(() => {
        const interval = setInterval(() => {
            setPos(p => ({
                lat: p.lat + (Math.random() - 0.5) * 0.0012,
                lng: p.lng + (Math.random() - 0.5) * 0.0012,
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Marker 
            position={[pos.lat, pos.lng]} 
            icon={busIcon(bus.status, isSelected)} 
            eventHandlers={{ click: onClick }}
        >
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
    const [buses, setBuses] = useState(MOCK_BUSES);
    const [cities, setCities] = useState(DEFAULT_CITIES);
    const [selectedBus, setSelectedBus] = useState(MOCK_BUSES[0]);
    const [drawerOpen, setDrawerOpen] = useState(true);

    useEffect(() => {
        // Fetch dynamic cities, buses and slots from API
        Promise.all([
            api.get('/cities').catch(() => ({ data: [] })),
            api.get('/buses').catch(() => api.get('/admin/buses')).catch(() => ({ data: [] })),
            api.get('/timeslots').catch(() => api.get('/admin/timeslots')).catch(() => ({ data: [] }))
        ]).then(([cityRes, busRes, slotRes]) => {
            const rawCities = Array.isArray(cityRes.data) ? cityRes.data : [];
            const dbBuses = Array.isArray(busRes.data) ? busRes.data : [];
            const dbSlots = Array.isArray(slotRes.data) ? slotRes.data : [];

            // Map dynamic cities with coordinates
            let loadedCities = DEFAULT_CITIES;
            if (rawCities.length > 0) {
                loadedCities = rawCities.map((c, i) => {
                    const nameKey = c.name.trim();
                    const known = Object.entries(KNOWN_COORDS).find(([k]) => k.toLowerCase() === nameKey.toLowerCase());
                    if (known) return { id: c.id, name: c.name, ...known[1] };
                    const hash = c.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    return {
                        id: c.id,
                        name: c.name,
                        lat: 12.0965 + (((hash + i * 7) % 11) - 5) * 0.018,
                        lng: 75.5685 + ((((hash * 3) + i * 5) % 11) - 5) * 0.018
                    };
                });
                setCities(loadedCities);
            }

            let merged = [];
            if (dbBuses.length > 0) {
                merged = dbBuses.map((b, idx) => {
                    const slot = dbSlots.find(s => s.bus_id === b.id || s.bus_number === b.bus_number);
                    const destName = slot ? slot.destination : (loadedCities[idx % loadedCities.length]?.name || 'Kannur');
                    
                    const matchedCity = loadedCities.find(c => c.name.toLowerCase() === destName.toLowerCase());
                    let cityCoord = matchedCity ? { lat: matchedCity.lat, lng: matchedCity.lng } : null;

                    if (!cityCoord) {
                        const known = Object.entries(KNOWN_COORDS).find(([k]) => k.toLowerCase() === destName.toLowerCase());
                        cityCoord = known ? known[1] : null;
                    }

                    if (!cityCoord) {
                        const hash = destName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        cityCoord = {
                            lat: 12.0965 + (((hash + idx * 7) % 11) - 5) * 0.018,
                            lng: 75.5685 + ((((hash * 3) + idx * 5) % 11) - 5) * 0.018
                        };
                    }

                    // Compute position along route
                    const busLat = (VJEC.lat + cityCoord.lat) / 2 + (idx % 2 === 0 ? 0.004 : -0.004);
                    const busLng = (VJEC.lng + cityCoord.lng) / 2 + (idx % 2 === 0 ? -0.004 : 0.004);

                    return {
                        id: b.id,
                        busNumber: b.bus_number || b.busNumber,
                        route: `VJEC → ${destName}`,
                        status: b.status === 'active' || b.status === 'On Route' ? 'On Route' : 'At Stop',
                        lat: busLat,
                        lng: busLng,
                        eta: `${12 + (idx * 6) % 30} min`,
                        speed: '45 km/h',
                        nextStop: destName,
                        passengers: b.seats_booked || 28
                    };
                });
            } else {
                // Construct buses for loaded cities if no db buses
                merged = loadedCities.map((c, idx) => ({
                    id: `city-bus-${idx}`,
                    busNumber: `KL-58-${String.fromCharCode(65 + (idx % 26))}-${1111 * (idx + 1)}`,
                    route: `VJEC → ${c.name}`,
                    status: idx % 3 === 0 ? 'At Stop' : idx % 3 === 1 ? 'Departing' : 'On Route',
                    lat: (VJEC.lat + c.lat) / 2 + (idx % 2 === 0 ? 0.004 : -0.004),
                    lng: (VJEC.lng + c.lng) / 2 + (idx % 2 === 0 ? -0.004 : 0.004),
                    eta: `${10 + (idx * 5) % 30} min`,
                    speed: '45 km/h',
                    nextStop: c.name,
                    passengers: 20 + (idx * 7) % 25
                }));
            }

            setBuses(merged);
            if (merged.length > 0) setSelectedBus(merged[0]);
        }).catch(err => {
            console.error('Live tracking data fetch fail:', err);
        });
    }, []);

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
                    <span className="text-gray-400">{buses.length} buses active</span>
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
                        <MapController selectedBus={selectedBus} />
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
                                    <p className="text-xs text-gray-500">Chelimparamba, Chemperi, Kannur</p>
                                    <p className="text-xs text-gray-400 mt-1">Bus Terminal</p>
                                </div>
                            </Popup>
                        </Marker>

                        {/* City markers */}
                        {cities.map(city => (
                            <Marker key={city.name} position={[city.lat, city.lng]} icon={cityIcon}>
                                <Popup><div className="font-sans text-sm font-bold">{city.name}</div></Popup>
                            </Marker>
                        ))}

                        {/* Animated bus markers */}
                        {buses.map(bus => (
                            <AnimatedBus 
                                key={bus.id} 
                                bus={bus} 
                                isSelected={selectedBus?.id === bus.id}
                                onClick={() => setSelectedBus(bus)}
                            />
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
                        {buses.map(bus => {
                            const isSel = selectedBus?.id === bus.id;
                            return (
                                <button key={bus.id} onClick={() => setSelectedBus(bus)}
                                    className={`w-full text-left p-5 border-b transition-all hover:bg-orange-50/50 ${isSel ? 'bg-[#FFF6C6] border-l-8 border-l-[#F97316] ring-2 ring-orange-300 shadow-md scale-[1.01]' : ''}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm">{bus.busNumber}</p>
                                            {isSel && (
                                                <span className="bg-[#F97316] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">SELECTED</span>
                                            )}
                                        </div>
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
                            );
                        })}
                    </div>

                    {/* Selected Bus Info */}
                    {selectedBus && (
                        <div className="p-5 bg-[#131718] text-white border-t border-gray-800">
                            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Selected Bus</p>
                            <p className="font-display text-2xl mb-3 text-[#FEC29F]">{selectedBus.busNumber}</p>
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
                    {buses.map(bus => (
                        <button key={bus.id} onClick={() => setSelectedBus(bus)}
                            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${selectedBus?.id === bus.id ? 'bg-[#F97316] text-white shadow-md ring-2 ring-orange-300' : 'bg-gray-100 text-gray-500'}`}>
                            {bus.busNumber}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
