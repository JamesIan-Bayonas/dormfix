// server/src/controllers/authController.ts
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { userRepository } from '../repositories/userRepository';

const generateDormCode = () => {
    return '#' + Math.floor(100000 + Math.random() * 900000).toString();
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await userRepository.findByEmail(email);

        if (!user) {
             res.status(401).json({ error: "Invalid email or password" });
             return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
             res.status(401).json({ error: "Invalid email or password" });
             return;
        }

        const { password: _, ...safeUser } = user;

        const formattedUser = {
            ...safeUser,
            phoneNumber: user.phone_number || undefined,
            dormFixId: user.dorm_fix_id,
            isApproved: user.is_approved, 
            createdAt: user.created_at
        };

        res.json(formattedUser);

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const register = async (req: Request, res: Response) => {
    const { name, email, password, role, landlordCode, phoneNumber } = req.body;

    if (!name || !email || !password || !role) {
         res.status(400).json({ error: "Missing required fields" });
         return;
    }   

    try {
        const userId = crypto.randomUUID();
        const hashedPassword = await bcrypt.hash(password, 10);
        
        let myDormFixId = '';
        let landlordId: string | undefined;
        
        const isApproved = role === 'landlord' ? 1 : 0; 

        if (role === 'landlord') {
            myDormFixId = generateDormCode(); 
        } else if (role === 'tenant') {
            myDormFixId = 'T-' + Math.floor(1000 + Math.random() * 9000);
            
            if (!landlordCode) {
                res.status(400).json({ error: "Landlord Code is required for Tenants" });
                return;
            }
            
            const landlordRecord = await userRepository.findLandlordByDormFixId(landlordCode);
            if (!landlordRecord) {
                res.status(400).json({ error: "Invalid Landlord Code" });
                return;
            }
            landlordId = landlordRecord.id;
        }

        await userRepository.registerTransaction({
            id: userId,
            name,
            email,
            hashedPassword,
            role,
            dormFixId: myDormFixId,
            isApproved,
            landlordId,
            phoneNumber: phoneNumber ? String(phoneNumber).trim() : null
        });

        res.status(201).json({ message: "Registration successful" });

    } catch (error: any) {
        console.error("Register Error:", error.message);
        res.status(400).json({ error: error.message || "Registration failed" });
    }
};

export const updateUserProfile = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, phoneNumber } = req.body;

    if (!name || !name.trim()) {
        res.status(400).json({ error: "Name is required" });
        return;
    }

    try {
        const updated = await userRepository.updateProfile(
            id, 
            name.trim(), 
            phoneNumber ? String(phoneNumber).trim() : null
        );

        if (!updated) {
            res.status(404).json({ error: "User profile not found" });
            return;
        }

        const { password: _, ...safeUser } = updated;
        const formattedUser = {
            ...safeUser,
            phoneNumber: updated.phone_number || undefined,
            dormFixId: updated.dorm_fix_id,
            isApproved: updated.is_approved,
            createdAt: updated.created_at
        };

        res.json({ message: "Profile updated successfully", user: formattedUser });
    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
};