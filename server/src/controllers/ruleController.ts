// server/src/controllers/ruleController.ts
import type { Request, Response } from 'express';
import crypto from 'crypto';
import { ruleRepository } from '../repositories/ruleRepository';

// 1. GET RULES
export const getRules = async (req: Request, res: Response) => {
    const { landlordId } = req.params;
    try {
        const rules = await ruleRepository.getByLandlord(landlordId);
        res.json(rules);
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