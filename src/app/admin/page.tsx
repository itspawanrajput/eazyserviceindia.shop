'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, LogOut, LayoutDashboard, Wrench, Star, HelpCircle, Phone, Palette, MapPin, Loader2, CheckCircle } from 'lucide-react';
import type { SiteContent, ServiceData, ReviewData, FAQData } from '@/lib/data';

type Tab = 'brand' | 'services' | 'reviews' | 'faqs' | 'contact' | 'areas';

export default function AdminDashboard() {
    const [content, setContent] = useState<SiteContent | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('brand');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchContent = useCallback(async () => {
        try {
            const res = await fetch('/api/content');
            const data = await res.json();
            setContent(data);
        } catch (err) {
            console.error('Failed to load content:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchContent(); }, [fetchContent]);

    const handleSave = async () => {
        if (!content) return;
        setSaving(true);
        setSaved(false);
        try {
            const res = await fetch('/api/content', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(content),
            });
            if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
        } catch (err) { console.error('Save failed:', err); }
        finally { setSaving(false); }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
    };

    if (loading || !content) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'brand', label: 'Brand & Hero', icon: <Palette className="w-5 h-5" /> },
        { id: 'services', label: 'Services', icon: <Wrench className="w-5 h-5" /> },
        { id: 'reviews', label: 'Reviews', icon: <Star className="w-5 h-5" /> },
        { id: 'faqs', label: 'FAQs', icon: <HelpCircle className="w-5 h-5" /> },
        { id: 'contact', label: 'Contact', icon: <Phone className="w-5 h-5" /> },
        { id: 'areas', label: 'Service Areas', icon: <MapPin className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Bar */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <LayoutDashboard className="w-6 h-6 text-blue-600" />
                        <h1 className="text-xl font-bold text-slate-900">EazyService Admin</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {saved && (
                            <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                <CheckCircle className="w-4 h-4" /> Saved!
                            </div>
                        )}
                        <button onClick={handleSave} disabled={saving}
                            className="h-10 px-5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button onClick={handleLogout} className="h-10 px-4 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2">
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="md:w-56 shrink-0">
                        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100'}`}>
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
                            {activeTab === 'brand' && <BrandEditor content={content} setContent={setContent} />}
                            {activeTab === 'services' && <ServicesEditor content={content} setContent={setContent} />}
                            {activeTab === 'reviews' && <ReviewsEditor content={content} setContent={setContent} />}
                            {activeTab === 'faqs' && <FAQsEditor content={content} setContent={setContent} />}
                            {activeTab === 'contact' && <ContactEditor content={content} setContent={setContent} />}
                            {activeTab === 'areas' && <AreasEditor content={content} setContent={setContent} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------- Editor Components ----------

interface EditorProps {
    content: SiteContent;
    setContent: React.Dispatch<React.SetStateAction<SiteContent | null>>;
}

function InputField({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
    return (
        <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" />
        </div>
    );
}

function BrandEditor({ content, setContent }: EditorProps) {
    const update = (field: string, value: string) => {
        setContent(prev => prev ? { ...prev, brand: { ...prev.brand, [field]: value } } : null);
    };
    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Brand & Hero Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Brand Name" value={content.brand.name} onChange={(v) => update('name', v)} />
                <InputField label="Tagline" value={content.brand.tagline} onChange={(v) => update('tagline', v)} />
                <div className="md:col-span-2"><InputField label="Hero Headline" value={content.brand.heroHeadline} onChange={(v) => update('heroHeadline', v)} /></div>
                <InputField label="Rating" value={content.brand.heroRating} onChange={(v) => update('heroRating', v)} />
                <InputField label="Booking Count Text" value={content.brand.heroBookingCount} onChange={(v) => update('heroBookingCount', v)} />
                <InputField label="Hero Background Image URL" value={content.brand.heroBackgroundImage} onChange={(v) => update('heroBackgroundImage', v)} />
                <InputField label="Hero Person Image URL" value={content.brand.heroPersonImage} onChange={(v) => update('heroPersonImage', v)} />
                <div className="md:col-span-2"><InputField label="VIP Banner Text" value={content.brand.vipText} onChange={(v) => update('vipText', v)} /></div>
            </div>
        </div>
    );
}

function ServicesEditor({ content, setContent }: EditorProps) {
    const updateService = (index: number, field: keyof ServiceData, value: string | string[]) => {
        setContent(prev => {
            if (!prev) return null;
            const services = [...prev.services];
            services[index] = { ...services[index], [field]: value };
            return { ...prev, services };
        });
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Services</h2>
            <div className="space-y-8">
                {content.services.map((service, idx) => (
                    <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                        <h3 className="text-lg font-bold text-blue-600 mb-4">Service {idx + 1}: {service.title}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Title" value={service.title} onChange={(v) => updateService(idx, 'title', v)} />
                            <InputField label="Badge" value={service.badge} onChange={(v) => updateService(idx, 'badge', v)} />
                            <div className="md:col-span-2"><InputField label="Heading" value={service.heading} onChange={(v) => updateService(idx, 'heading', v)} /></div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                                <textarea value={service.description} onChange={(e) => updateService(idx, 'description', e.target.value)}
                                    className="w-full p-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all text-sm h-24" />
                            </div>
                            <InputField label="Image URL" value={service.image} onChange={(v) => updateService(idx, 'image', v)} />
                            <InputField label="Highlight Text" value={service.highlight} onChange={(v) => updateService(idx, 'highlight', v)} />
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Content Tags (comma-separated)</label>
                                <input value={service.content.join(', ')} onChange={(e) => updateService(idx, 'content', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    className="w-full p-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Bullet Points (comma-separated)</label>
                                <input value={service.bullets.join(', ')} onChange={(e) => updateService(idx, 'bullets', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    className="w-full p-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ReviewsEditor({ content, setContent }: EditorProps) {
    const updateReview = (index: number, field: keyof ReviewData, value: string) => {
        setContent(prev => {
            if (!prev) return null;
            const reviews = [...prev.reviews];
            reviews[index] = { ...reviews[index], [field]: value };
            return { ...prev, reviews };
        });
    };

    const addReview = () => {
        setContent(prev => prev ? { ...prev, reviews: [...prev.reviews, { name: '', location: '', text: '' }] } : null);
    };

    const removeReview = (index: number) => {
        setContent(prev => prev ? { ...prev, reviews: prev.reviews.filter((_, i) => i !== index) } : null);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Customer Reviews</h2>
                <button onClick={addReview} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all">+ Add Review</button>
            </div>
            <div className="space-y-4">
                {content.reviews.map((review, idx) => (
                    <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-sm font-bold text-slate-500">Review {idx + 1}</span>
                            <button onClick={() => removeReview(idx)} className="text-red-500 text-xs font-bold hover:text-red-700">Remove</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <InputField label="Name" value={review.name} onChange={(v) => updateReview(idx, 'name', v)} />
                            <InputField label="Location" value={review.location} onChange={(v) => updateReview(idx, 'location', v)} />
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Review Text</label>
                                <textarea value={review.text} onChange={(e) => updateReview(idx, 'text', e.target.value)}
                                    className="w-full p-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all text-sm h-20" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FAQsEditor({ content, setContent }: EditorProps) {
    const updateFAQ = (index: number, field: keyof FAQData, value: string) => {
        setContent(prev => {
            if (!prev) return null;
            const faqs = [...prev.faqs];
            faqs[index] = { ...faqs[index], [field]: value };
            return { ...prev, faqs };
        });
    };

    const addFAQ = () => {
        setContent(prev => prev ? { ...prev, faqs: [...prev.faqs, { q: '', a: '' }] } : null);
    };

    const removeFAQ = (index: number) => {
        setContent(prev => prev ? { ...prev, faqs: prev.faqs.filter((_, i) => i !== index) } : null);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">FAQs</h2>
                <button onClick={addFAQ} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all">+ Add FAQ</button>
            </div>
            <div className="space-y-4">
                {content.faqs.map((faq, idx) => (
                    <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-sm font-bold text-slate-500">FAQ {idx + 1}</span>
                            <button onClick={() => removeFAQ(idx)} className="text-red-500 text-xs font-bold hover:text-red-700">Remove</button>
                        </div>
                        <div className="space-y-3">
                            <InputField label="Question" value={faq.q} onChange={(v) => updateFAQ(idx, 'q', v)} />
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Answer</label>
                                <textarea value={faq.a} onChange={(e) => updateFAQ(idx, 'a', e.target.value)}
                                    className="w-full p-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all text-sm h-20" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ContactEditor({ content, setContent }: EditorProps) {
    const update = (field: string, value: string) => {
        setContent(prev => prev ? { ...prev, contact: { ...prev.contact, [field]: value } } : null);
    };
    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Phone Display" value={content.contact.phone} onChange={(v) => update('phone', v)} placeholder="+91 9999999999" />
                <InputField label="Phone Link" value={content.contact.phoneLink} onChange={(v) => update('phoneLink', v)} placeholder="tel:+919999999999" />
                <InputField label="Email" value={content.contact.email} onChange={(v) => update('email', v)} />
                <InputField label="WhatsApp Number" value={content.contact.whatsapp} onChange={(v) => update('whatsapp', v)} placeholder="919999999999" />
                <div className="md:col-span-2"><InputField label="Address" value={content.contact.address} onChange={(v) => update('address', v)} /></div>
                <InputField label="Business Hours" value={content.contact.businessHours} onChange={(v) => update('businessHours', v)} />
                <InputField label="Facebook URL" value={content.contact.facebook} onChange={(v) => update('facebook', v)} />
                <InputField label="Instagram URL" value={content.contact.instagram} onChange={(v) => update('instagram', v)} />
                <InputField label="Twitter URL" value={content.contact.twitter} onChange={(v) => update('twitter', v)} />
            </div>
        </div>
    );
}

function AreasEditor({ content, setContent }: EditorProps) {
    const [newArea, setNewArea] = useState('');
    const addArea = () => {
        if (newArea.trim()) {
            setContent(prev => prev ? { ...prev, serviceAreas: [...prev.serviceAreas, newArea.trim()] } : null);
            setNewArea('');
        }
    };
    const removeArea = (index: number) => {
        setContent(prev => prev ? { ...prev, serviceAreas: prev.serviceAreas.filter((_, i) => i !== index) } : null);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Service Areas</h2>
            <div className="flex gap-3 mb-6">
                <input value={newArea} onChange={(e) => setNewArea(e.target.value)} placeholder="Add new area..."
                    className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addArea())} />
                <button onClick={addArea} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
                {content.serviceAreas.map((area, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                        <span className="text-sm font-bold text-blue-700">{area}</span>
                        <button onClick={() => removeArea(idx)} className="text-blue-400 hover:text-red-500 text-xs font-bold">✕</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
