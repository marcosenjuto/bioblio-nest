/**
 * 🔒 Security Configuration
 * Centralized security settings for development and production environments
 */

export const SecurityConfig = {
  // Development settings
  development: {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:4200',
        'http://localhost:5173',
        'http://localhost:8080',
        'http://localhost:8100',
        'http://192.168.56.1:8100',
        'http://31.97.31.143:4001',
        'http://31.97.31.143:4002',
        'http://192.168.100.5:8100',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-eval'"], // Allow eval for development
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", 'http://31.97.31.143:4001', 'http://31.97.31.143:4002'], // Añade el origen para conexiones
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: false, 
    },
    throttle: {
      ttl: 60000, // 1 minute
      limit: 1000, // 1000 requests per minute (increased for development/testing)
    },
  },

  // Production settings
  production: {
    cors: {
      origin: process.env.FRONTEND_URL || 'https://yourdomain.com',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    },
    throttle: {
      ttl: 60000, // 1 minute
      limit: 60, // 60 requests per minute (stricter)
    },
  },
};

/**
 * Get security configuration based on environment
 */
export const getSecurityConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return SecurityConfig[env] || SecurityConfig.development;
};

/**
 * 🛡️ Security Best Practices Checklist
 * 
 * ✅ CORS Configuration
 *    - Specific origins (no wildcards with credentials)
 *    - Proper headers and methods
 * 
 * ✅ Helmet Security Headers
 *    - Content Security Policy (CSP)
 *    - HTTP Strict Transport Security (HSTS)
 *    - X-Frame-Options
 *    - X-Content-Type-Options
 * 
 * ✅ Rate Limiting
 *    - Prevent brute force attacks
 *    - API abuse protection
 * 
 * 🔒 Additional Recommendations:
 *    - Use HTTPS in production
 *    - Implement JWT with short expiration
 *    - Validate all inputs with DTOs
 *    - Use environment variables for secrets
 *    - Regular security audits
 *    - Monitor logs for suspicious activity
 */