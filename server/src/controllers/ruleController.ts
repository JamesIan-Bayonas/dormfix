import type { Request, Response } from 'express';
import { poolPromise } from '../config/dbConfig';
import sql from 'mssql';
import crypto from 'crypto';

// 1. GET RULES
export const getRules = async (req: Request, res: Response) => {
    const { landlordId } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('lid', sql.VarChar(36), landlordId)
            .query(`
                SELECT id, rule_text, target_room_number 
                FROM house_rules 
                WHERE landlord_id = @lid 
                ORDER BY created_at DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error("Get Rules Error:", error);
        res.status(500).json({ error: "Failed to fetch rules" });
    }
};

// 2. ADD RULE
export const addRule = async (req: Request, res: Response) => {
    const { landlordId, ruleText, roomNumber } = req.body;
    
    if (!landlordId || !ruleText) {
         res.status(400).json({ error: "Missing fields" });
         return;
    }

    try {
        const id = crypto.randomUUID();
        const pool = await poolPromise;
        
        await pool.request()
            .input('id', sql.VarChar(36), id)
            .input('lid', sql.VarChar(36), landlordId)
            .input('text', sql.NVarChar(sql.MAX), ruleText)
            .input('target', sql.VarChar(50), roomNumber || null) // Handle Scope
            .query(`
                INSERT INTO house_rules (id, landlord_id, rule_text, target_room_number)
                VALUES (@id, @lid, @text, @target)
            `);
            
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
        const pool = await poolPromise;
        await pool.request().input('id', sql.VarChar(36), id)
            .query('DELETE FROM house_rules WHERE id = @id');
        res.json({ message: "Rule deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete rule" });
    }
};