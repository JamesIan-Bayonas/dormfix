import express from 'express';
// Note the .ts extension
import { getRules, addRule, deleteRule } from '../controllers/ruleController.ts';

const router = express.Router();

// Define routes (base path will be /api/rules)
router.get('/:landlordId', getRules);

router.post('/', addRule);

router.delete('/:id', deleteRule);


export default router;