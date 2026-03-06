import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Phone, Mail, MapPin, Send } from 'lucide-react';
import api from '../../api/client';

const FAQS = [
    { q: 'How do I book a bus pass?', a: 'Log in to your PassGo account, go to your Dashboard, and follow the 4-step booking flow. Select your city, pick a time slot, complete payment, and your digital QR ticket will be generated instantly.' },
    { q: 'What is the fare for a bus pass?', a: 'All routes from Vimal Jyothi Engineering College have a flat fare of ₹25, regardless of your destination city.' },
    { q: 'Can I cancel a pass after booking?', a: 'Currently, booking cancellations must be handled by the Transport Office directly. Please contact them at the number below.' },
    { q: 'How do I show my pass to the driver?', a: 'Simply open your pass from the Dashboard or History page and display the QR code to the driver for scanning.' },
    { q: 'What if my QR code is not scanning?', a: 'Ensure your screen brightness is at maximum. If the issue persists, contact the transport office with your Booking ID.' },
    { q: 'How do I track my bus live?', a: 'Go to the "Live Tracking" section from the main menu. You will see all active buses on the map near Chemberi and their estimated arrival times.' },
    { q: 'What cities are covered by PassGo?', a: 'PassGo covers 6 cities: Kannur, Thalassery, Payyanur, Iritty, Mattannur, and Taliparamba — with morning and evening departures daily.' },
];

export default function Support() {
    const [openFaq, setOpenFaq] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSend = async e => {
        e.preventDefault();
        setSending(true);
        setError('');
        // We'll submit this to an admin email endpoint (mocked for now)
        setTimeout(() => {
            setSent(true);
            setSending(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Bar */}
            <div className="bg-[#131718] text-white px-6 py-4 flex items-center gap-3">
                <Link to="/dashboard" className="text-white/60 hover:text-white">
                    <ArrowLeft size={20} />
                </Link>
                <span className="font-display text-2xl tracking-widest">SUPPORT & HELP</span>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-10 space-y-12">
                {/* Emergency Card */}
                <div className="bg-[#FEC29F] rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="font-display text-3xl text-[#131718] mb-1">TRANSPORT OFFICE</p>
                        <p className="text-sm text-gray-700">For urgent pass or bus issues, call us directly.</p>
                    </div>
                    <div className="space-y-2 text-sm">
                        <a href="tel:+914972226000" className="flex items-center gap-2 font-bold text-[#131718] hover:underline">
                            <Phone size={16} /> +91 497 222 6000
                        </a>
                        <a href="mailto:transport@vjec.ac.in" className="flex items-center gap-2 font-bold text-[#131718] hover:underline">
                            <Mail size={16} /> transport@vjec.ac.in
                        </a>
                        <div className="flex items-center gap-2 text-gray-600">
                            <MapPin size={16} /> Chemberi, Kannur, Kerala
                        </div>
                    </div>
                </div>

                {/* FAQ Accordion */}
                <div>
                    <p className="font-display text-4xl text-[#131718] mb-6">FREQUENTLY ASKED</p>
                    <div className="space-y-3">
                        {FAQS.map((faq, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                <button className="w-full flex justify-between items-center p-5 text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                    <span className="text-sm font-semibold pr-4">{faq.q}</span>
                                    {openFaq === i ? <ChevronUp size={18} className="text-gray-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
                                </button>
                                {openFaq === i && (
                                    <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-4">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Form */}
                <div>
                    <p className="font-display text-4xl text-[#131718] mb-6">CONTACT US</p>
                    {sent ? (
                        <div className="bg-green-50 border border-green-200 text-green-700 rounded-3xl p-8 text-center">
                            <p className="font-display text-3xl mb-2">MESSAGE SENT!</p>
                            <p className="text-sm">Our team will respond to you within 24 hours.</p>
                            <button onClick={() => setSent(false)} className="mt-4 text-xs text-green-600 underline">Send another</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSend} className="bg-white rounded-3xl p-6 border border-gray-100 space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Name</label>
                                    <input name="name" value={form.name} onChange={handleChange} required placeholder="Your name"
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Email</label>
                                    <input name="email" value={form.email} onChange={handleChange} required type="email" placeholder="you@vjec.ac.in"
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Subject</label>
                                <input name="subject" value={form.subject} onChange={handleChange} required placeholder="e.g. Can't download ticket"
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Message</label>
                                <textarea name="message" value={form.message} onChange={handleChange} required rows={4} placeholder="Describe your issue..."
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#131718] focus:outline-none resize-none" />
                            </div>
                            {error && <div className="text-red-500 text-sm">{error}</div>}
                            <button type="submit" disabled={sending}
                                className="flex items-center gap-2 bg-[#131718] text-white px-8 py-4 rounded-full font-semibold text-sm hover:bg-[#FEC29F] hover:text-[#131718] transition-all disabled:opacity-50">
                                <Send size={16} /> {sending ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
