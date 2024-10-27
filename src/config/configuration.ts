export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  databaseUrl: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
});
