import React, { useState, useEffect } from 'react';
import { getForms, saveForm } from '../../services/api';
import {
    FormInput,
    Save,
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    Loader2,
    CheckCircle2,
    Settings2
} from 'lucide-react';

export interface FormField {
    id: string; // Unique programmatic ID for the form payload
    label: string; // Display label
    type: 'text' | 'email' | 'tel' | 'textarea' | 'select'; // Input type
    placeholder: string;
    required: boolean;
    options?: string[]; // For 'select' type
}

const FORMS_LIST = [
    { id: 'hero-booking-form', name: 'Hero Form (Top of Page)' },
    { id: 'main-booking-form', name: 'Main Booking Form (Middle)' },
    { id: 'popup-booking-form', name: 'Popup / Modal Form' }
];

const FormBuilder: React.FC = () => {
    const [activeFormId, setActiveFormId] = useState<string>(FORMS_LIST[0].id);
    const [fields, setFields] = useState<FormField[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        loadForm();
    }, [activeFormId]);

    const loadForm = async () => {
        setIsLoading(true);
        try {
            const allForms = await getForms();
            const currentForm = allForms.find((f: any) => f.id === activeFormId);

            if (currentForm && currentForm.fields_json && currentForm.fields_json.length > 0) {
                setFields(currentForm.fields_json);
            } else {
                // Provide standard default fields if empty
                setFields([
                    { id: 'name', label: 'Your Name', type: 'text', placeholder: 'e.g. John Doe', required: true },
                    { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Your 10-digit number', required: true },
                    { id: 'service_type', label: 'Service Category', type: 'select', placeholder: '', required: true, options: ['AC Service', 'AC Repair', 'Installation', 'Gas Charging', 'Other'] },
                ]);
            }
        } catch (error) {
            console.error("Failed to load forms", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            const formName = FORMS_LIST.find(f => f.id === activeFormId)?.name || activeFormId;
            await saveForm(activeFormId, formName, fields);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error("Failed to save form", error);
            alert("Failed to save form configuration");
        } finally {
            setIsSaving(false);
        }
    };

    const addField = () => {
        const newField: FormField = {
            id: `custom_field_${Date.now()}`,
            label: 'New Field',
            type: 'text',
            placeholder: '',
            required: false
        };
        setFields([...fields, newField]);
    };

    const updateField = (index: number, key: keyof FormField, value: any) => {
        const updated = [...fields];
        updated[index] = { ...updated[index], [key]: value };
        setFields(updated);
    };

    const removeField = (index: number) => {
        const updated = [...fields];
        updated.splice(index, 1);
        setFields(updated);
    };

    const moveField = (index: number, direction: -1 | 1) => {
        if (index + direction < 0 || index + direction >= fields.length) return;
        const updated = [...fields];
        const temp = updated[index];
        updated[index] = updated[index + direction];
        updated[index + direction] = temp;
        setFields(updated);
    };

    const updateOptions = (index: number, optionsString: string) => {
        const options = optionsString.split(',').map(s => s.trim()).filter(Boolean);
        updateField(index, 'options', options);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 justify-between rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600">
                        <Settings2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Form Builder</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">Customize the input fields for your public website forms.</p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving || isLoading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Form Config'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Left Sidebar: Form Selector */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-100 p-4 h-fit">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Select Form</h2>
                    <div className="space-y-2">
                        {FORMS_LIST.map((form) => (
                            <button
                                key={form.id}
                                onClick={() => setActiveFormId(form.id)}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeFormId === form.id
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <FormInput className={`w-4 h-4 ${activeFormId === form.id ? 'text-blue-500' : 'text-slate-400'}`} />
                                    {form.name}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 font-medium">
                        <span className="font-bold">Note:</span> The <strong>Name</strong>, <strong>Phone</strong>, and <strong>Service Category</strong> fields are highly recommended for the Lead Management dashboard to render properly. Any extra fields you add will appear in the "View Details" modal.
                    </div>
                </div>

                {/* Right Content: Field Editor */}
                <div className="lg:col-span-3 space-y-4">

                    {isLoading ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                            <p className="font-bold">Loading form configuration...</p>
                        </div>
                    ) : fields.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
                            <FormInput className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-black text-slate-700 mb-2">No Fields Configured</h3>
                            <p className="text-slate-500 mb-6 font-medium">Add your first field to start building this form.</p>
                            <button onClick={addField} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 mx-auto hover:bg-slate-800">
                                <Plus className="w-4 h-4" /> Add Field
                            </button>
                        </div>
                    ) : (
                        <>
                            {fields.map((field, index) => (
                                <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 group flex gap-4 transition-all hover:border-blue-300">

                                    {/* Reorder Controls */}
                                    <div className="flex flex-col items-center justify-center gap-1 border-r border-slate-100 pr-4">
                                        <button
                                            onClick={() => moveField(index, -1)}
                                            disabled={index === 0}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <span className="text-xs font-black text-slate-300 select-none">{index + 1}</span>
                                        <button
                                            onClick={() => moveField(index, 1)}
                                            disabled={index === fields.length - 1}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Field Configuration */}
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                                        {/* Label */}
                                        <div className="lg:col-span-1">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Field Label</label>
                                            <input
                                                type="text"
                                                value={field.label}
                                                onChange={(e) => updateField(index, 'label', e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="e.g. Your Name"
                                            />
                                        </div>

                                        {/* Field ID */}
                                        <div className="lg:col-span-1">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Field API ID</label>
                                            <input
                                                type="text"
                                                value={field.id}
                                                onChange={(e) => updateField(index, 'id', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold font-mono text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="e.g. full_name"
                                            />
                                        </div>

                                        {/* Input Type */}
                                        <div className="lg:col-span-1">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Input Type</label>
                                            <select
                                                value={field.type}
                                                onChange={(e) => updateField(index, 'type', e.target.value as any)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                            >
                                                <option value="text">Short Text</option>
                                                <option value="email">Email Address</option>
                                                <option value="tel">Phone Number</option>
                                                <option value="textarea">Long Text (Paragraph)</option>
                                                <option value="select">Dropdown Menu</option>
                                            </select>
                                        </div>

                                        {/* Placeholder */}
                                        <div className="lg:col-span-1">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Placeholder</label>
                                            <input
                                                type="text"
                                                value={field.placeholder}
                                                onChange={(e) => updateField(index, 'placeholder', e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Optional hint..."
                                            />
                                        </div>

                                        {/* Select Options (Only visible if type is select) */}
                                        {field.type === 'select' && (
                                            <div className="md:col-span-2 lg:col-span-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                                <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Dropdown Options (Comma separated)</label>
                                                <input
                                                    type="text"
                                                    value={field.options?.join(', ') || ''}
                                                    onChange={(e) => updateOptions(index, e.target.value)}
                                                    className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="e.g. AC Repair, Installation, Gas Charging"
                                                />
                                            </div>
                                        )}

                                        {/* Toggles */}
                                        <div className="md:col-span-2 lg:col-span-4 flex items-center justify-between pt-2 border-t border-slate-50">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={field.required}
                                                    onChange={(e) => updateField(index, 'required', e.target.checked)}
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-bold text-slate-700">Required Field</span>
                                            </label>

                                            <button
                                                onClick={() => removeField(index)}
                                                className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" /> Remove Field
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            ))}

                            {/* Add Field Button */}
                            <button
                                onClick={addField}
                                className="w-full border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-all rounded-xl p-4 flex items-center justify-center gap-2 font-bold"
                            >
                                <Plus className="w-5 h-5" /> Add New Field
                            </button>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};

export default FormBuilder;
