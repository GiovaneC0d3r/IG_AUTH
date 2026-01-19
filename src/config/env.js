import 'dotenv/config'; 
export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  instagram: {
    clientId: process.env.INSTAGRAM_CLIENT_ID,
    sessionSecret: process.env.SESSION_SECRET,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI,
  },
  urls: {
    authorize: 'https://www.instagram.com/oauth/authorize',
    accessToken: 'https://api.instagram.com/oauth/access_token',
    graphAccess: 'https://graph.instagram.com/access_token',
    graphMe: 'https://graph.instagram.com/v22.0/me'
  }
};