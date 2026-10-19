import express from 'express';
import type { SessionActor } from '../middleware/session';
import { requireSession } from '../middleware/session';
import { announcementRepository as repository } from '../repositories/announcementRepository';
import { validateAnnouncement } from '../services/announcementValidation';

const router = express.Router();
router.use(requireSession);
router.use((_req, res, next) => {
    const actor = res.locals.actor as SessionActor;
    if (actor.role !== 'landlord' && !(actor.role === 'tenant' && actor.isApproved)) { res.status(403).json({ error: 'Announcement access is unavailable for this account.' }); return; }
    res.setHeader('Cache-Control', 'no-store');
    next();
});
router.get('/', async (_req, res) => {
    const actor = res.locals.actor as SessionActor;
    try { res.json(actor.role === 'landlord' ? await repository.landlordList(actor.id) : await repository.tenantList(actor.id)); }
    catch { res.status(503).json({ error: 'Announcements could not be loaded. Please try again.' }); }
});
router.use((_req, res, next) => {
    if ((res.locals.actor as SessionActor).role !== 'landlord') { res.status(403).json({ error: 'Only landlords can manage announcements.' }); return; }
    next();
});
router.post('/', async (req, res) => {
    let data;
    try { data = validateAnnouncement(req.body); }
    catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid announcement.' }); return; }
    try {
        const actor = res.locals.actor as SessionActor;
        if (data.roomNumber && !await repository.ownsRoom(actor.id, data.roomNumber)) { res.status(400).json({ error: 'The selected room does not belong to your dormitory.' }); return; }
        res.status(201).json(await repository.create(actor.id, data));
    } catch { res.status(503).json({ error: 'Saving could not be confirmed. Refresh announcements before trying again.' }); }
});
router.put('/:id', async (req, res) => {
    let data;
    try {
        data = validateAnnouncement(req.body);
        if (!Number.isInteger(req.body.version) || req.body.version < 1) throw new Error('Refresh the announcement before editing.');
    } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid announcement.' }); return; }
    try {
        const actor = res.locals.actor as SessionActor;
        if (data.roomNumber && !await repository.ownsRoom(actor.id, data.roomNumber)) { res.status(400).json({ error: 'The selected room does not belong to your dormitory.' }); return; }
        const saved = await repository.update(String(req.params.id), actor.id, req.body.version, data);
        if (!saved) { res.status(409).json({ error: 'This notice changed, was archived, or is unavailable. Refresh before editing. Published notices cannot become drafts.' }); return; }
        res.json(saved);
    } catch { res.status(503).json({ error: 'Saving could not be confirmed. Refresh announcements before trying again.' }); }
});
router.post('/:id/archive', async (req, res) => {
    if (!Number.isInteger(req.body?.version) || req.body.version < 1) { res.status(400).json({ error: 'Refresh the announcement before archiving.' }); return; }
    try {
        const saved = await repository.archive(String(req.params.id), (res.locals.actor as SessionActor).id, req.body.version);
        if (!saved) { res.status(409).json({ error: 'This notice changed or is unavailable. Refresh before archiving.' }); return; }
        res.json(saved);
    } catch { res.status(503).json({ error: 'Archiving could not be confirmed. Refresh announcements before trying again.' }); }
});
export default router;
