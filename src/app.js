import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url'; // Necessário para recriar __dirname

// Imports locais (sempre com .js no final)
import { config } from './config/env.js';
import authRoutes from './routes/auth.routes.js';

// Recriando __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


app.use(helmet());
app.use(cookieParser(config.instagram.sessionSecret));
app.use(express.static(path.join(__dirname, '../public')));


app.use('/api/auth', authRoutes);


app.use((req, res) => {
  res.status(404).json({ message: 'Recurso não encontrado' });
});



export default app