const env = process.env;

const config = {
  db: { /* do not put password or any sensitive info here, done only for demo */
    host: env.DB_HOST || 'localhost',
    port: env.DB_PORT || '5432',
    user: env.DB_USER || 'tuckerbichsel',
    password: env.DB_PASSWORD || 'password',
    database: env.DB_NAME || 'dvc_api',
  },
  TOKEN_KEY: env.TOKEN_KEY || 'sometoken',
};

module.exports = config;