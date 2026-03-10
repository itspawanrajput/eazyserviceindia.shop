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
    AlertCircle,
    Send,
    Sheet,
    MessageCircle,
    ExternalLink,
    Info
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
        maintenanceMode: 'false',
        // Email Notification Settings
        notificationEmail: '',
        smtpHost: '',
        smtpPort: '465',
        smtpUser: '',
        smtpPassword: '',
        // Google Sheets Integration
        googleSheetWebhookUrl: '',
        // WhatsApp Notification
        whatsappNotifyNumber: '',
        whatsappApiUrl: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showSmtp, setShowSmtp] = useState(false);

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

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);
        setStatus(null);
        try {
            await updateSettings(settings);
            setStatus({ type: 'success', message: 'Settings saved successfully!' });
            setTimeout(() => setStatus(null), 5000);
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.message || 'Failed to save settings. Please check your login.';
            setStatus({ type: 'error', message: msg });
            console.error('Save error:', err);
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

                {/* Email Notifications — Simplified */}
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Send className="w-5 h-5 text-purple-600" />
                            <h2 className="font-bold text-slate-900">Email Notifications</h2>
                        </div>
                        {settings.notificationEmail && (
                            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">Active</span>
                        )}
                    </div>
                    <div className="p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Send Leads To Email</label>
                            <input
                                type="email"
                                name="notificationEmail"
                                placeholder="your@email.com"
                                value={settings.notificationEmail}
                                onChange={handleChange}
                                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-purple-500 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400"
                            />
                            <p className="text-xs text-slate-500 mt-2 font-medium">Every new lead will be emailed to this address.</p>
                        </div>

                        {/* Advanced SMTP — hidden by default */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setShowSmtp(!showSmtp)}
                                className="text-sm font-bold text-slate-500 hover:text-slate-700 flex items-center gap-2 transition-colors"
                            >
                                <SettingsIcon className="w-4 h-4" />
                                {showSmtp ? 'Hide' : 'Show'} SMTP Settings (Advanced)
                            </button>
                            {showSmtp && (
                                <div className="mt-4 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                    <p className="text-xs text-slate-500 mb-4 font-medium">Only needed if you want emails sent automatically. Use your Hostinger or Gmail SMTP credentials.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-2">SMTP Host</label>
                                            <input type="text" name="smtpHost" placeholder="smtp.hostinger.com" value={settings.smtpHost} onChange={handleChange}
                                                className="w-full p-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500 transition-all outline-none text-sm text-slate-900" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-2">SMTP Port</label>
                                            <select name="smtpPort" value={settings.smtpPort} onChange={handleChange}
                                                className="w-full p-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500 transition-all outline-none text-sm text-slate-900">
                                                <option value="465">465 (SSL/TLS)</option>
                                                <option value="587">587 (STARTTLS)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-2">SMTP Email</label>
                                            <input type="text" name="smtpUser" placeholder="your-email@domain.com" value={settings.smtpUser} onChange={handleChange}
                                                className="w-full p-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500 transition-all outline-none text-sm text-slate-900" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-2">SMTP Password</label>
                                            <input type="password" name="smtpPassword" placeholder="••••••••" value={settings.smtpPassword} onChange={handleChange}
                                                className="w-full p-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500 transition-all outline-none text-sm text-slate-900" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Google Sheets Integration */}
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Sheet className="w-5 h-5 text-green-600" />
                            <h2 className="font-bold text-slate-900">Google Sheets Integration</h2>
                        </div>
                        {settings.googleSheetWebhookUrl && (
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Active</span>
                        )}
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-bold mb-2">How to set up Google Sheets:</p>
                                    <ol className="list-decimal pl-4 space-y-1 text-xs">
                                        <li>Create a Google Sheet with headers: <code className="bg-blue-100 px-1 rounded">Name, Phone, Email, Location, Service, Source, Message, Date</code></li>
                                        <li>Go to <strong>Extensions → Apps Script</strong></li>
                                        <li>Paste the script that handles <code className="bg-blue-100 px-1 rounded">doPost(e)</code> and appends rows</li>
                                        <li>Click <strong>Deploy → New Deployment → Web App</strong></li>
                                        <li>Set "Who has access" to <strong>Anyone</strong>, then copy the URL below</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Google Apps Script Web App URL</label>
                            <input
                                type="url"
                                name="googleSheetWebhookUrl"
                                placeholder="https://script.google.com/macros/s/AKfy.../exec"
                                value={settings.googleSheetWebhookUrl}
                                onChange={handleChange}
                                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-green-500 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400"
                            />
                            <p className="text-xs text-slate-500 mt-2 font-medium">Every new lead will be appended as a row to your Google Sheet automatically.</p>
                        </div>
                    </div>
                </div>

                {/* WhatsApp Notification */}
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <MessageCircle className="w-5 h-5 text-green-500" />
                            <h2 className="font-bold text-slate-900">WhatsApp Lead Alerts</h2>
                        </div>
                        {settings.whatsappNotifyNumber && (
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Active</span>
                        )}
                    </div>
                    <div className="p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp Notification Number</label>
                            <input
                                type="text"
                                name="whatsappNotifyNumber"
                                placeholder="919911481331 (with country code, no +)"
                                value={settings.whatsappNotifyNumber}
                                onChange={handleChange}
                                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-green-500 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400"
                            />
                            <p className="text-xs text-slate-500 mt-2 font-medium">New leads will generate a WhatsApp message link. Include country code without + (e.g., 919911481331).</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <SettingsIcon className="w-4 h-4 text-slate-500" /> Advanced: WhatsApp API (Optional)
                            </h3>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">WhatsApp Business API / Green API URL</label>
                                <input
                                    type="url"
                                    name="whatsappApiUrl"
                                    placeholder="https://api.green-api.com/waInstance.../sendMessage/..."
                                    value={settings.whatsappApiUrl}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-green-500 transition-all outline-none text-sm text-slate-900"
                                />
                                <p className="text-xs text-slate-400 mt-2 font-medium">If configured, leads will be sent automatically via API. Otherwise, a clickable WhatsApp link will be shown in Lead Management.</p>
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
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden mb-20">
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
