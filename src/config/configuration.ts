export default () => ({
  port: parseInt(process.env.PORT ?? '3006', 10),
  mongodb: {
    uri: process.env.MONGODB_URI ?? '',
  },
  agora: {
    appId: process.env.AGORA_APP_ID ?? '',
    appCertificate: process.env.AGORA_APP_CERTIFICATE ?? '',
    tokenExpirySeconds: parseInt(process.env.AGORA_TOKEN_EXPIRY ?? '86400', 10),
  },
  joinToken: {
    secret: process.env.JOIN_TOKEN_SECRET ?? '',
  },
  frontend: {
    baseUrl: process.env.FRONTEND_BASE_URL ?? 'http://localhost:3000',
  },
});
