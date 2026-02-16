import express from 'express';
import { login, register } from '../controllers/authController.ts';

const router = express.Router();

// Define the routes
router.post('/login', login);

router.post('/register', register);


export default router;