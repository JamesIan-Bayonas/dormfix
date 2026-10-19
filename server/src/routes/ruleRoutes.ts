import { requireSession } from '../middleware/session';
import { landlordOnly, selfBody, bindBody, ruleOwner, ruleReader } from '../middleware/authorization';
import express from 'express';
// Note the .ts extension
import { getRules, addRule, deleteRule } from '../controllers/ruleController';

const router = express.Router();
router.use(requireSession);

// Define routes (base path will be /api/rules)
router.get('/:landlordId', ruleReader, getRules);

router.post('/', landlordOnly, selfBody('landlordId'), bindBody('landlordId'), addRule);

router.delete('/:id', ruleOwner, deleteRule);


export default router;