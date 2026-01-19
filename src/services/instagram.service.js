import axios from 'axios';
import crypto from 'node:crypto'; // 'node:' deixa explícito que é nativo
import { config } from '../config/env.js'; // Em ESM, a extensão .js é obrigatória

class InstagramService {
  /**
   * Gera a URL de autenticação e o state
   */
  generateAuthUrl() {
    const state = crypto.randomBytes(16).toString('hex');
    const url = new URL(config.urls.authorize);
    
    url.searchParams.append('client_id', config.instagram.clientId);
    url.searchParams.append('redirect_uri', config.instagram.redirectUri);
    url.searchParams.append('scope', 'instagram_business_basic');
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('state', state);

    return { url: url.toString(), state };
  }

  /**
   * Orquestra todo o fluxo de troca de token
   */
  async processCallback(code) {
    const shortToken = await this.#getShortLivedToken(code);
    const igaToken = await this.#getLongLivedToken(shortToken);
    const userInfo = await this.#getUserInfo(igaToken);

    return {
      ...userInfo,
      token: igaToken
    };
  }

  // Métodos privados com # (feature moderna do JS)
  async #getShortLivedToken(code) {
    const params = new URLSearchParams({
      client_id: config.instagram.clientId,
      client_secret: config.instagram.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: config.instagram.redirectUri,
      code
    });

    const { data } = await axios.post(config.urls.accessToken, params);
    return data.access_token;
  }

  async #getLongLivedToken(shortToken) {
    const { data } = await axios.get(config.urls.graphAccess, {
      params: {
        grant_type: 'ig_exchange_token',
        client_secret: config.instagram.clientSecret,
        access_token: shortToken
      }
    });
    return data.access_token;
  }

  async #getUserInfo(token) {
    const { data } = await axios.get(config.urls.graphMe, {
      params: {
        fields: 'user_id,username,account_type',
        access_token: token
      }
    });
    return data;
  }
}

export default new InstagramService();