// Northflank Production Configuration
export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'production',
  
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
      sslmode: 'require'
    } : false,
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  },
  
  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    tls: process.env.NODE_ENV === 'production',
    ttl: 3600, // 1 hour
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256'
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'https://emr-app.northflank.com',
    credentials: true,
    optionsSuccessStatus: 200
  },
  
  // Logging Configuration
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: process.env.NODE_ENV === 'production' ? 'json' : 'dev'
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000
  },
  
  // File Upload Configuration
  upload: {
    maxSize: '10MB',
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
  },
  
  // Prisma Configuration
  prisma: {
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    errorFormat: 'pretty'
  },
  
  // Northflank Specific
  northflank: {
    domain: process.env.NF_DOMAIN,
    region: process.env.NF_REGION || 'europe-west1',
    project: process.env.NF_PROJECT
  },
  
  // Monitoring & Health
  health: {
    timeout: 5000,
    interval: 30000
  },
  
  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }
};

export default config;
