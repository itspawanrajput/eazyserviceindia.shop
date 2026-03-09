import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../services/api';
import {
    Settings as SettingsIcon,
    Save,
    Globe,
    Mail,
    Phone,
    MapPin,
    Facebook,
    Instagram,
    Twitter,
    Loader2,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<any>({
        siteName: 'CoolGoa AC Services',
        contactEmail: 'support@coolgoa.com',
        contactPhone: '+91 98765 43210',
        address: 'Panjim, Goa, India',
        facebookUrl: '',
        instagramUrl: '',
        twitterUrl: '',
        maintenanceMode: 'false'
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await getSettings();
            if (Object.keys(data).length > 0) {
                setSettings((prev: any) => ({ ...prev, ...data }));
            }
        } catch (err) {
            console.error('Failed to fetch settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setStatus(null);
        try {
            await updateSettings(settings);
            setStatus({ type: 'success', message: 'Settings saved successfully' });
            setTimeout(() => setStatus(null), 3000);
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Platform Settings</h1>
                    <p className="text-slate-500 font-medium">Manage global configurations for your website.</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                </button>
            </div>

            {status && (
                <div className={`p-4 rounded-2xl mb-8 flex items-center gap-3 font-bold text-sm ${status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                    {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {status.message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* General Settings */}
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-slate-900">General Configuration</h2>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Site Name / Business Name</label>
                                <input
                                    type="text"
                                    name="siteName"
                                    value={settings.siteName}
                                    onChange={handleChange}
                                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Maintenance Mode</label>
                                <select
                                    name="maintenanceMode"
                                    value={settings.maintenanceMode}
                                    onChange={handleChange}
                                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900 font-medium"
                                >
                                    <option value="false">Disabled (Site is Live)</option>
                                    <option value="true">Enabled (Show Coming Soon)</option>
                                </select>
                                <p className="text-xs text-slate-400 mt-2 font-medium">When enabled, visitors will see a maintenance message.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-slate-900">Contact Information</h2>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-slate-400" /> Public Email Address
                                </label>
                                <input
                                    type="email"
                                    name="contactEmail"
                                    value={settings.contactEmail}
                                    onChange={handleChange}
                                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-slate-400" /> Primary Phone Number
                                </label>
                                <input
                                    type="text"
                                    name="contactPhone"
                                    value={settings.contactPhone}
                                    onChange={handleChange}
                                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900 font-medium"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400" /> Business Address
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={settings.address}
                                    onChange={handleChange}
                                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900 font-medium"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Media Links */}
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden mb-12">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                        <SettingsIcon className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-slate-900">Social Media Links</h2>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Facebook className="w-4 h-4 text-blue-600" /> Facebook Profile URL
                                </label>
                                <input
                                    type="url"
                                    name="facebookUrl"
                                    placeholder="https://facebook.com/your-page"
                                    value={settings.facebookUrl}
                                    onChange={handleChange}
                                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Instagram className="w-4 h-4 text-pink-600" /> Instagram Profile URL
                                </label>
                                <input
                                    type="url"
                                    name="instagramUrl"
                                    placeholder="https://instagram.com/your-profile"
                                    value={settings.instagramUrl}
                                    onChange={handleChange}
                                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Twitter className="w-4 h-4 text-sky-500" /> Twitter/X Profile URL
                                </label>
                                <input
                                    type="url"
                                    name="twitterUrl"
                                    placeholder="https://twitter.com/your-handle"
                                    value={settings.twitterUrl}
                                    onChange={handleChange}
                                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900 font-medium"
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </form>
        </div>
    );
};

export default Settings;
