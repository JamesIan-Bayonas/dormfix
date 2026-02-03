import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ScrollText, ShieldCheck, Home, Globe } from 'lucide-react';
import { ruleService, type HouseRule } from '../../services/ruleService';
import { useAuth } from '../UserContext';
import { useRooms } from '../../hooks/useRooms'; // 🟢 Import useRooms

export const LandlordRules: React.FC = () => {
    const { user } = useAuth();
    // 🟢 Fetch Rooms for the dropdown
    const { rooms } = useRooms(user?.id);
    
    const [rules, setRules] = useState<HouseRule[]>([]);
    const [newRule, setNewRule] = useState('');
    const [targetScope, setTargetScope] = useState('Global'); // 🟢 Control Scope
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user?.id) loadRules();
    }, [user?.id]);

    const loadRules = async () => {
        if (!user?.id) return;
        const data = await ruleService.getRules(user.id);
        setRules(data);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRule.trim() || !user?.id) return;
        
        setIsLoading(true);
        // 🟢 Pass the targetScope (Global or Room #)
        await ruleService.addRule(user.id, newRule, targetScope);
        setNewRule('');
        setTargetScope('Global'); // Reset to default
        await loadRules();
        setIsLoading(false);
    };

    const handleDelete = async (id: string) => {
        if(!confirm("Remove this rule?")) return;
        await ruleService.deleteRule(id);
        setRules(rules.filter(r => r.id !== id));
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-display font-bold text-gray-800 flex items-center gap-2">
                        <ShieldCheck className="text-emerald-600" size={20}/> House Rules
                    </h2>
                    <p className="text-xs text-gray-500">Define the code of conduct for your dorm.</p>
                </div>
                <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                    {rules.length} Active Rules
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* INPUT AREA */}
                <div className="lg:col-span-1">
                    <form onSubmit={handleAdd} className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 space-y-4">
                        
                        {/* 🟢 SCOPE SELECTOR */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Apply To</label>
                            <div className="relative">
                                <select 
                                    value={targetScope}
                                    onChange={(e) => setTargetScope(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white"
                                >
                                    <option value="Global">Global (All Rooms)</option>
                                    <optgroup label="Specific Rooms">
                                        {rooms.map(room => (
                                            <option key={room.id} value={room.room_number}>
                                                Room {room.room_number}
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Rule Description</label>
                            <textarea 
                                value={newRule}
                                onChange={(e) => setNewRule(e.target.value)}
                                placeholder="e.g. No loud music after 10 PM..."
                                className="w-full p-3 rounded-lg border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm min-h-[100px]"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading || !newRule.trim()}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Saving...' : <><Plus size={16}/> Add Rule</>}
                        </button>
                    </form>
                </div>

                {/* LIST AREA */}
                <div className="lg:col-span-2 space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {rules.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                            <ScrollText size={48} className="mb-3 opacity-20"/>
                            <p>No rules defined yet.</p>
                        </div>
                    ) : (
                        rules.map((rule, index) => (
                            <div key={rule.id} className="group flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all hover:border-emerald-200 relative">
                                
                                {/* 🟢 SCOPE BADGE */}
                                <div className="absolute top-4 right-10">
                                    {rule.target_room_number ? (
                                        <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100">
                                            <Home size={10}/> Room {rule.target_room_number}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200">
                                            <Globe size={10}/> Global
                                        </span>
                                    )}
                                </div>

                                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                    {index + 1}
                                </div>
                                <p className="text-gray-700 text-sm flex-1 leading-relaxed pr-16">
                                    {rule.rule_text}
                                </p>
                                <button 
                                    onClick={() => handleDelete(rule.id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors p-1 absolute top-4 right-4"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};