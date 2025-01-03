export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  databaseUrl: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_ACCESS_SECRET,
  jwtExpiration: process.env.JWT_ACCESS_EXPIRATION,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION,
  saltRounds: parseInt(process.env.SALT_ROUNDS, 10) || 10,
});
