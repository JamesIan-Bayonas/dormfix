// client/src/components/landlord/LandlordRules.tsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, ScrollText, ShieldCheck, Home, Globe, 
  Volume2, Users, AlertTriangle, Sparkles, ArrowLeft
} from 'lucide-react';
import { ruleService, type HouseRule } from '../../services/ruleService';
import { useAuth } from '../UserContext';
import { useRooms } from '../../hooks/useRooms';

export const LandlordRules: React.FC = () => {
    const { user } = useAuth();
    const { rooms } = useRooms(user?.id);
    
    const [rules, setRules] = useState<HouseRule[]>([]);
    const [newRule, setNewRule] = useState('');
    const [targetScope, setTargetScope] = useState('Global');
    const [category, setCategory] = useState('General');
    const [isPriority, setIsPriority] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user?.id) loadRules();
    }, [user?.id]);

    const loadRules = async () => {
        if (!user?.id) return;
        try {
            const data = await ruleService.getRules(user.id);
            setRules(data);
        } catch (error) {
            console.error("Failed to load rules", error);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRule.trim() || !user?.id) return;
        
        setIsLoading(true);
        try {
            await ruleService.addRule(user.id, newRule, targetScope, category, isPriority);
            setNewRule('');
            setCategory('General');
            setIsPriority(false);
            setTargetScope('Global');
            await loadRules();
        } catch (error) {
            console.error("Failed to add rule", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if(!confirm("Remove this rule from the ledger?")) return;
        try {
            await ruleService.deleteRule(id);
            setRules(rules.filter(r => r.id !== id));
        } catch (error) {
            console.error("Failed to delete rule", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9f5] p-4 sm:p-8 animate-fade-in text-slate-800">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* PAGE TYPOGRAPHY HEADER */}
                <div className="border-b border-gray-200/60 pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-serif text-slate-800 mb-1">House Rules</h1>
                        <p className="text-slate-500 text-sm">Define, configure, and maintain building policies and boarder protocols.</p>
                    </div>
                    <div className="shrink-0 self-start sm:self-auto">
                        <span className="px-4 py-2 bg-[#e7efdb] text-[#5c6e4e] text-xs font-bold rounded-full uppercase tracking-wider border border-[#d3e0c0]">
                            {rules.length} Active Rules
                        </span>
                    </div>
                </div>

                {/* TWO-COLUMN INTUITIVE WORKSPACE LAYOUT */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    
                    {/* LEFT PANEL: PREMIUM CONTROL INPUT FORM */}
                    <div className="md:col-span-1 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <form onSubmit={handleAdd} className="space-y-4">
                            
                            {/* SCOPE SELECTOR ELEMENT */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Apply To</label>
                                <select 
                                    value={targetScope}
                                    onChange={(e) => setTargetScope(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 bg-[#f8f9f5] text-xs text-slate-700 font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#425042] transition-all"
                                >
                                    <option value="Global">Global (All Rooms)</option>
                                    <optgroup label="Specific Units">
                                        {rooms.map(room => (
                                            <option key={room.id} value={room.room_number}>
                                                Unit {room.room_number}
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            {/* CATEGORY SELECTOR ELEMENT */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category Tag</label>
                                <select 
                                    value={category} 
                                    onChange={(e) => setCategory(e.target.value)} 
                                    className="w-full p-3 rounded-xl border border-gray-200 bg-[#f8f9f5] text-xs text-slate-700 font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#425042] transition-all"
                                >
                                    <option value="General">General</option>
                                    <option value="Safety">Safety</option>
                                    <option value="Noise">Noise</option>
                                    <option value="Guests">Guests</option>
                                    <option value="Cleanliness">Cleanliness</option>
                                </select>
                            </div>

                            {/* CRITICAL PRIORITY INPUT ACTION */}
                            <div className="flex items-center gap-2 py-1 select-none">
                                <input 
                                    type="checkbox" 
                                    id="priority" 
                                    checked={isPriority} 
                                    onChange={(e) => setIsPriority(e.target.checked)} 
                                    className="checkbox checkbox-xs text-[#425042]"
                                />
                                <label htmlFor="priority" className="text-xs font-medium text-slate-600 flex items-center gap-1 cursor-pointer">
                                    <AlertTriangle size={12} className="text-amber-600" /> Critical Policy Indicator
                                </label>
                            </div>

                            {/* RULE CONTENT SPECIFICATION */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rule Specification</label>
                                <textarea 
                                    value={newRule}
                                    onChange={(e) => setNewRule(e.target.value)}
                                    placeholder="State building rule parameters clearly..."
                                    className="w-full p-3 rounded-xl border border-gray-200 bg-[#f8f9f5] text-xs text-slate-700 font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#425042] transition-all min-h-[90px] leading-relaxed"
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading || !newRule.trim()}
                                className="w-full py-2.5 bg-[#425042] hover:bg-[#344034] text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                            >
                                {isLoading ? 'Saving Policy...' : <><Plus size={14}/> Add Rule Entry</>}
                            </button>
                        </form>
                    </div>

                    {/* RIGHT LEDGER DISPLAY AREA */}
                    <div className="lg:col-span-2 bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col h-[520px]">
                        <div className="px-2 pb-4 border-b border-gray-100 mb-4 flex justify-between items-center bg-transparent">
                            <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-[#657655]" /> Active Directives
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {rules.length === 0 ? (
                                <div className="text-center py-16 text-slate-400 text-sm font-medium flex flex-col items-center justify-center h-full">
                                    <ScrollText size={32} className="mb-2 opacity-30 text-slate-400"/>
                                    <p>No house policies configured yet</p>
                                </div>
                            ) : (
                                rules.map((rule, index) => (
                                    <div 
                                        key={rule.id} 
                                        className={`group flex items-start gap-4 p-4 border rounded-2xl transition-all relative
                                            ${rule.is_priority 
                                                ? 'bg-[#fff7f7] border-[#fce8e8]' 
                                                : 'bg-[#f8f9f5] border-gray-200/50 hover:bg-[#f4f7f4]'}`}
                                    >
                                        {/* TONE MATCHED CATEGORY LOG LAYOUTS */}
                                        <div className="absolute top-4 right-10 flex gap-1.5">
                                            <span className="flex items-center gap-1 bg-[#e7efdb] text-[#5c6e4e] px-2 py-0.5 rounded text-[9px] font-bold border border-[#d3e0c0] uppercase tracking-wider">
                                                {rule.category}
                                            </span>

                                            {rule.target_room_number ? (
                                                <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[9px] font-bold border border-blue-100">
                                                    Unit {rule.target_room_number}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 bg-white text-slate-400 px-2 py-0.5 rounded text-[9px] font-bold border border-gray-200">
                                                    Global
                                                </span>
                                            )}
                                        </div>

                                        {/* INDEX INDICATORS */}
                                        <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 
                                            ${rule.is_priority ? 'bg-red-100 text-red-600' : 'bg-white border border-gray-200 text-slate-500'}`}>
                                            {rule.is_priority ? <AlertTriangle size={12}/> : index + 1}
                                        </div>

                                        <div className="flex-1 pr-12">
                                            <p className="text-slate-700 text-xs font-medium leading-relaxed pt-0.5">
                                                {rule.rule_text}
                                            </p>
                                            {rule.is_priority && (
                                                <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider mt-1 block">Critical Building Rule</span>
                                            )}
                                        </div>

                                        <button 
                                            type="button"
                                            onClick={() => handleDelete(rule.id)}
                                            className="text-slate-300 hover:text-[#cc4747] transition-colors p-1 absolute top-4 right-4 outline-none"
                                            title="Delete Rule"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};