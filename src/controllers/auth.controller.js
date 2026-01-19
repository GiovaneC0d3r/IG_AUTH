import instagramService from '../services/instagram.service.js';
import { config } from '../config/env.js';

// ---------------------------------------------------------
// MAPA DE DEDUPLICAÇÃO (A "Mágica" para o Render)
// Armazena promessas de requisições em andamento
// ---------------------------------------------------------
const pendingRequests = new Map();

class AuthController {
  
  /**
   * Passo 1: Redireciona para o Instagram
   */
  initiate(req, res) {
    try {
      const { url, state } = instagramService.generateAuthUrl();

      // Configuração robusta de Cookies para funcionar com Proxy/Render
      res.cookie('auth_state', state, {
        httpOnly: true,
        // Em produção (Render) precisa ser true. Localmente false.
        secure: config.nodeEnv === 'production', 
        // Importante para o Chrome não bloquear o cookie no redirect
        sameSite: config.nodeEnv === 'production' ? 'None' : 'Lax',
        maxAge: 300000, // 5 minutos
        signed: true
      });

      return res.redirect(url);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao iniciar login' });
    }
  }

  /**
   * Passo 2: Recebe o código e troca pelo Token
   */
  async callback(req, res) {
    const { code, state, error, error_description } = req.query;

    // 1. Validações de Erro do Instagram
    if (error) {
      return res.status(400).json({ error: 'Login falhou', details: error_description });
    }
    
    if (!code) {
      return res.status(400).json({ error: 'Código não fornecido' });
    }

    // 2. Validação de Segurança (CSRF) - CRÍTICO: ISSO ESTAVA FALTANDO
    const storedState = req.signedCookies?.auth_state;
    
    // Sempre limpamos o cookie, independente de sucesso ou falha
    res.clearCookie('auth_state');

    if (!storedState || storedState !== state) {
      console.error('Mismatch de State:', { recebido: state, cookie: storedState });
      return res.status(403).json({ error: 'Sessão inválida ou expirada. Tente novamente.' });
    }

    try {
      // -----------------------------------------------------------
      // LÓGICA ANTI-DUPLICAÇÃO (Evita erro "Code has been used")
      // -----------------------------------------------------------

      // Se já existe uma requisição processando ESTE código, esperamos ela terminar
      if (pendingRequests.has(code)) {
        console.log(`🔄 [Cache] Reutilizando requisição em andamento para o code: ${code.substring(0, 5)}...`);
        
        // Espera a promessa original resolver
        const data = await pendingRequests.get(code);
        
        return res.json({
          status: 'success',
          message: 'Autenticado com sucesso (via cache)',
          data
        });
      }

      // Se é a primeira vez, cria a promessa e salva no mapa
      const processingPromise = instagramService.processCallback(code);
      pendingRequests.set(code, processingPromise);

      // Aguarda o resultado real
      const data = await processingPromise;

      // Limpa do mapa após 10 segundos (tempo suficiente para requests duplicados serem atendidos)
      setTimeout(() => pendingRequests.delete(code), 10000);

      return res.json({
        status: 'success',
        message: 'Autenticado com sucesso',
        data
      });

    } catch (err) {
      // Se der erro, removemos do mapa imediatamente
      pendingRequests.delete(code);

      console.error('Erro Auth:', err.response?.data || err.message);
      
      // Tratamento amigável se o código realmente expirou
      if (err.response?.data?.error_message?.includes('authorization code has been used')) {
        return res.status(409).json({ 
          error: 'Código expirado. Por favor, reinicie o processo de login.' 
        });
      }

      return res.status(500).json({ 
        error: 'Falha na comunicação com Instagram',
        details: err.message 
      });
    }
  }
}

export default new AuthController();