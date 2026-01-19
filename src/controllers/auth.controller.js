import instagramService from '../services/instagram.service.js';
import { config } from '../config/env.js';

class AuthController {
  
  initiate(req, res) {
    try {
      const { url, state } = instagramService.generateAuthUrl();

      res.cookie('auth_state', state, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        maxAge: 300000,
        signed: true
      });

      return res.redirect(url);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao iniciar login' });
    }
  }

  async callback(req, res) {
    const { code, state, error, error_description } = req.query;

    // Validações básicas
    if (error) return res.status(400).json({ error: 'Login falhou', details: error_description });
    if (!code) return res.status(400).json({ error: 'Código não fornecido' });


    const storedState = req.signedCookies?.auth_state;

    res.clearCookie('auth_state');

    try {
      const data = await instagramService.processCallback(code);
      
      return res.json({
        status: 'success',
        message: 'Autenticado com sucesso',
        data
      });
    } catch (err) {
      console.error('Erro Auth:', err.response?.data || err.message);
      return res.status(500).json({ 
        error: 'Falha na comunicação com Instagram',
        details: err.message 
      });
    }
  }
}

export default new AuthController();