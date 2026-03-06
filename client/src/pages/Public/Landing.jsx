import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Bus, QrCode, MapPin, ChevronDown } from 'lucide-react';

export default function Landing() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-white text-[#131718] overflow-x-hidden">
            {/* NAV */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 bg-white/90 backdrop-blur-md border-b border-gray-100">
                <span className="font-display text-2xl tracking-widest">PASSGO</span>
                <div className="flex items-center gap-6">
                    <a href="#how" className="text-sm font-medium hover:text-[#FEC29F] transition-colors">How It Works</a>
                    <a href="#about" className="text-sm font-medium hover:text-[#FEC29F] transition-colors">About</a>
                    {user ? (
                        <Link to={user.role === 'student' ? '/dashboard' : '/admin'}
                            className="bg-[#131718] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#FEC29F] hover:text-[#131718] transition-all">
                            My Dashboard →
                        </Link>
                    ) : (
                        <Link to="/auth"
                            className="bg-[#131718] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#FEC29F] hover:text-[#131718] transition-all">
                            Get Started →
                        </Link>
                    )}
                </div>
            </nav>

            {/* HERO */}
            <section className="min-h-screen flex flex-col justify-end pb-24 px-6 md:px-12 pt-24 relative">
                {/* Background tinted card */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFF6C6]/40 via-white to-[#D1E6F6]/30 -z-10" />

                {/* Big badge */}
                <div className="absolute top-32 right-6 md:right-12">
                    <div className="bg-[#FFDAE4] rounded-2xl p-4 max-w-[160px] text-center shadow-sm">
                        <p className="font-display text-4xl">₹25</p>
                        <p className="text-xs font-medium text-gray-600 mt-1">Flat fare anywhere</p>
                    </div>
                </div>

                {/* Hero text */}
                <div className="max-w-5xl">
                    <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#FEC29F] mb-4">Vimal Jyothi Engineering College</p>
                    <h1 className="font-display text-[clamp(64px,12vw,160px)] leading-none text-[#131718] mb-6">
                        YOUR CAMPUS.<br />YOUR CITY.<br />
                        <span className="text-[#FEC29F]">ONE PASS.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 max-w-lg mb-10 font-medium">
                        The smartest way for VJEC students to book bus passes — instant, digital, and hassle-free.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link to="/auth"
                            className="inline-flex items-center gap-2 bg-[#131718] text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-[#FEC29F] hover:text-[#131718] transition-all group">
                            Book Your Pass
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#how"
                            className="inline-flex items-center gap-2 border-2 border-[#131718] text-[#131718] px-8 py-4 rounded-full text-base font-semibold hover:bg-[#131718] hover:text-white transition-all">
                            Learn More
                        </a>
                    </div>
                </div>

                {/* Stat bar */}
                <div className="mt-16 flex flex-wrap gap-10">
                    {[['6', 'Cities Covered'], ['12', 'Daily Trips'], ['₹25', 'Flat Fare']].map(([num, label]) => (
                        <div key={label}>
                            <p className="font-display text-5xl text-[#131718]">{num}</p>
                            <p className="text-sm text-gray-500 font-medium mt-1">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Scroll hint */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce text-gray-400">
                    <ChevronDown size={20} />
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how" className="py-24 px-6 md:px-12 bg-[#131718] text-white">
                <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#FEC29F] mb-4">Simple Process</p>
                <h2 className="font-display text-[clamp(40px,6vw,80px)] mb-16">HOW IT WORKS</h2>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { num: '01', icon: <Bus size={28} />, title: 'Pick Your Route', desc: 'Choose from 6 city destinations from Vimal Jyothi Engineering College. View bus timings and available seats in real time.', bg: '#FEC29F' },
                        { num: '02', icon: <QrCode size={28} />, title: 'Book & Pay', desc: 'Select your time slot and pay just ₹25 flat. Choose UPI or card — checkout takes under 30 seconds.', bg: '#D1E6F6' },
                        { num: '03', icon: <MapPin size={28} />, title: 'Show Your Pass', desc: 'Your digital QR ticket is instant. Show it to the driver or download as a PDF. Track your bus live on the map.', bg: '#FFDAE4' },
                    ].map(({ num, icon, title, desc, bg }) => (
                        <div key={num} className="group relative">
                            <div className="rounded-3xl p-8 border border-white/10 hover:border-white/30 transition-all h-full">
                                <p className="font-display text-6xl text-white/10 mb-6">{num}</p>
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5"
                                    style={{ backgroundColor: bg, color: '#131718' }}>
                                    {icon}
                                </div>
                                <h3 className="font-display text-3xl mb-3 text-white">{title}</h3>
                                <p className="text-gray-400 leading-relaxed">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ABOUT VJEC ROUTES */}
            <section id="about" className="py-24 px-6 md:px-12">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#FEC29F] mb-4">Coverage</p>
                        <h2 className="font-display text-[clamp(40px,5vw,72px)] mb-6">SIX CITIES,<br />ONE TICKET.</h2>
                        <p className="text-gray-500 leading-relaxed mb-8">
                            PassGo connects VJEC students to Kannur, Thalassery, Payyanur, Iritty, Mattannur, and Taliparamba —
                            with morning and evening trips every single day.
                        </p>
                        <Link to="/auth"
                            className="inline-flex items-center gap-2 bg-[#FEC29F] text-[#131718] px-8 py-4 rounded-full font-semibold hover:bg-[#131718] hover:text-white transition-all">
                            Get Started Free <ArrowRight size={18} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {['Kannur', 'Thalassery', 'Payyanur', 'Iritty', 'Mattannur', 'Taliparamba'].map((city, i) => (
                            <div key={city}
                                className="rounded-2xl p-5 font-display text-2xl"
                                style={{ backgroundColor: ['#FFF6C6', '#D1E6F6', '#FFDAE4', '#FEC29F', '#D1E6F6', '#FFF6C6'][i] }}>
                                {city}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA BANNER */}
            <section className="py-20 px-6 md:px-12 bg-[#FEC29F]">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <h2 className="font-display text-[clamp(32px,5vw,64px)] text-[#131718]">READY TO RIDE SMARTER?</h2>
                    <Link to="/auth"
                        className="shrink-0 bg-[#131718] text-white px-10 py-5 rounded-full font-semibold text-lg hover:scale-105 transition-transform whitespace-nowrap">
                        Book Now →
                    </Link>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-[#131718] text-white py-12 px-6 md:px-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    <div>
                        <span className="font-display text-3xl tracking-widest">PASSGO</span>
                        <p className="text-gray-400 text-sm mt-2">Bus passes for VJEC students.</p>
                    </div>
                    <div className="flex gap-10 text-sm text-gray-400">
                        {['About', 'Help', 'Contact', 'Terms'].map(l => (
                            <a key={l} href="#" className="hover:text-[#FEC29F] transition-colors">{l}</a>
                        ))}
                    </div>
                </div>
                <p className="text-gray-600 text-xs mt-10">© 2026 PassGo. Vimal Jyothi Engineering College.</p>
            </footer>
        </div>
    );
}
