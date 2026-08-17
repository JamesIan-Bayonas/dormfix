import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, X, ScrollText, CheckCircle2 } from 'lucide-react';
import { ruleService, type HouseRule } from '../../services/ruleService';

interface TenantRulesModalProps {
    isOpen: boolean;
    onClose: () => void;
    landlordId: string;
    roomNumber?: string;
}

export const TenantRulesModal: React.FC<TenantRulesModalProps> = ({
    isOpen,
    onClose,
    landlordId,
    roomNumber
}) => {
    const [rules, setRules] = useState<HouseRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && landlordId) {
            setIsLoading(true);
            ruleService.getRules(landlordId)
                .then(data => {
                    // Filter: Keep Global rules and rules matching this specific room
                    const applicable = data.filter(r => 
                        !r.target_room_number || 
                        r.target_room_number === 'Global' || 
                        r.target_room_number === roomNumber
                    );
                    // Sort: Priority rules first
                    applicable.sort((a, b) => (b.is_priority ? 1 : 0) - (a.is_priority ? 1 : 0));
                    setRules(applicable);
                })
                .catch(err => console.error("Failed to load rules", err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, landlordId, roomNumber]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 p-8 space-y-6 bg-[#f8f9f5]">
                
                {/* Header */}
                <div className="flex justify-between items-center pb-3 border-b border-gray-200/60">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-[#e7efdb] text-[#5c6e4e] rounded-xl border border-[#d3e0c0]">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-base text-slate-800">Building Policies & Rules</h3>
                            <p className="text-slate-400 text-[11px] font-medium">Standard operating guidelines for your tenancy</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 outline-none p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* Rules List Container */}
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-400 text-xs font-medium">Loading building directives...</div>
                    ) : rules.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-xs font-medium flex flex-col items-center justify-center">
                            <ScrollText size={32} className="mb-2 opacity-30 text-slate-400" />
                            <p>No active building policies published by your property manager.</p>
                        </div>
                    ) : (
                        rules.map((rule, idx) => (
                            <div 
                                key={rule.id || idx}
                                className={`p-4 rounded-2xl border transition-all relative space-y-2
                                    ${rule.is_priority 
                                        ? 'bg-[#fff7f7] border-[#fce8e8]' 
                                        : 'bg-white border-gray-200/60 shadow-xs'}`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border
                                        ${rule.is_priority 
                                            ? 'bg-red-100 text-red-700 border-red-200' 
                                            : 'bg-[#e7efdb] text-[#5c6e4e] border-[#d3e0c0]'}`}
                                    >
                                        {rule.category || 'General'}
                                    </span>

                                    {rule.target_room_number && rule.target_room_number !== 'Global' ? (
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                                            Unit {rule.target_room_number} Only
                                        </span>
                                    ) : (
                                        <span className="text-[9px] font-medium text-slate-400">
                                            Global Policy
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                    {rule.rule_text}
                                </p>

                                {rule.is_priority && (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-red-600">
                                        <AlertTriangle size={11} /> Critical Building Rule
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Confirmation */}
                <button 
                    onClick={onClose}
                    className="w-full py-3 bg-[#425042] hover:bg-[#344034] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                    <CheckCircle2 size={14} /> Understood & Acknowledged
                </button>
            </div>
        </div>
    );
};