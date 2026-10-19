// server/src/controllers/ruleController.ts
import type { Request, Response } from 'express';
import crypto from 'crypto';
import { ruleRepository } from '../repositories/ruleRepository';
import { pool } from '../config/dbConfig';

// 1. GET RULES
export const getRules = async (req: Request, res: Response) => {
    const { landlordId } = req.params;
    try {
        const rules = await ruleRepository.getByLandlord(landlordId);
        res.json(res.locals.actor.role === 'tenant' ? rules.filter(rule => !rule.target_room_number || rule.target_room_number === 'Global' || (res.locals.ruleRoom !== 'Unassigned' && rule.target_room_number === res.locals.ruleRoom)) : rules);
    } catch (error) {
        console.error("Get Rules Error:", error);
        res.status(500).json({ error: "Failed to fetch rules" });
    }
};

// 2. ADD RULE
export const addRule = async (req: Request, res: Response) => {
    const { landlordId, ruleText, roomNumber, category, isPriority } = req.body;
    
    if (!landlordId || !ruleText) {
         res.status(400).json({ error: "Missing fields" });
         return;
    }

    try {
        if (roomNumber && roomNumber !== 'Global') {
            if (!(await pool.query('SELECT 1 FROM rooms WHERE landlord_id=$1 AND room_number=$2',[landlordId,roomNumber])).rows.length) { res.status(400).json({error:'Choose a room in your dormitory.'});return; }
        }
        const id = crypto.randomUUID();
        await ruleRepository.create({
            id,
            landlordId,
            ruleText,
            roomNumber,
            category,
            isPriority
        });
            
        res.status(201).json({ message: "Rule added" });
    } catch (error) {
        console.error("Add Rule Error:", error);
        res.status(500).json({ error: "Failed to add rule" });
    }
};

// 3. DELETE RULE
export const deleteRule = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await ruleRepository.delete(id);
        res.json({ message: "Rule deleted" });
    } catch (error) {
        console.error("Delete Rule Error:", error);
        res.status(500).json({ error: "Failed to delete rule" });
    }
};
