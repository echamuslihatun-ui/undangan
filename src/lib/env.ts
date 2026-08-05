/**
 * Environment validation utility
 * Ensures required environment variables are set and provides type-safe access
 */

// Define required environment variables for each environment
const requiredEnvVars = {
  // Database
  DATABASE_URL: "Database connection URL",
  DIRECT_URL: "Direct database connection URL",

  // NextAuth
  NEXTAUTH_URL: "NextAuth application URL",
  NEXTAUTH_SECRET: "NextAuth secret key",

  // Google OAuth
  GOOGLE_CLIENT_ID: "Google OAuth client ID",
  GOOGLE_CLIENT_SECRET: "Google OAuth client secret",

  // Midtrans
  MIDTRANS_SERVER_KEY: "Midtrans server key",
  MIDTRANS_CLIENT_KEY: "Midtrans client key",

  // Cloudinary (optional but recommended)
  CLOUDINARY_CLOUD_NAME: "Cloudinary cloud name",
  CLOUDINARY_API_KEY: "Cloudinary API key",
  CLOUDINARY_API_SECRET: "Cloudinary API secret",
} as const;

const optionalEnvVars = {
  MIDTRANS_IS_PRODUCTION: "false", // Default to sandbox mode
  RESEND_API_KEY: "", // Required in production when credential auth is enabled
  EMAIL_FROM: "", // Example: Undanganku <noreply@example.com>
} as const;

/**
 * Validates that all required environment variables are set
 * @throws Error if any required environment variable is missing
 */
export function validateEnvironment(): void {
  const missingVars: string[] = [];

  for (const [key, description] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];
    if (!value) {
      missingVars.push(`${key} (${description})`);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}\n\n` +
      `Please check your .env.local file or set these variables in your deployment environment.`
    );
  }

  console.info('✅ Environment variables validated successfully');
}

/**
 * Type-safe environment variable access with defaults
 */
export const env = {
  // Database
  get DATABASE_URL(): string {
    const value = process.env.DATABASE_URL;
    if (!value) throw new Error('DATABASE_URL is required');
    return value;
  },

  get DIRECT_URL(): string {
    const value = process.env.DIRECT_URL;
    if (!value) throw new Error('DIRECT_URL is required');
    return value;
  },

  // NextAuth
  get NEXTAUTH_URL(): string {
    const value = process.env.NEXTAUTH_URL;
    if (!value) throw new Error('NEXTAUTH_URL is required');
    return value;
  },

  get NEXTAUTH_SECRET(): string {
    const value = process.env.NEXTAUTH_SECRET;
    if (!value) throw new Error('NEXTAUTH_SECRET is required');
    return value;
  },

  // Google OAuth
  get GOOGLE_CLIENT_ID(): string {
    const value = process.env.GOOGLE_CLIENT_ID;
    if (!value) throw new Error('GOOGLE_CLIENT_ID is required');
    return value;
  },

  get GOOGLE_CLIENT_SECRET(): string {
    const value = process.env.GOOGLE_CLIENT_SECRET;
    if (!value) throw new Error('GOOGLE_CLIENT_SECRET is required');
    return value;
  },

  // Midtrans
  get MIDTRANS_SERVER_KEY(): string {
    const value = process.env.MIDTRANS_SERVER_KEY;
    if (!value) throw new Error('MIDTRANS_SERVER_KEY is required');
    return value;
  },

  get MIDTRANS_CLIENT_KEY(): string {
    const value = process.env.MIDTRANS_CLIENT_KEY;
    if (!value) throw new Error('MIDTRANS_CLIENT_KEY is required');
    return value;
  },

  get MIDTRANS_IS_PRODUCTION(): boolean {
    const value = process.env.MIDTRANS_IS_PRODUCTION;
    return value === 'true';
  },

  // Cloudinary
  get CLOUDINARY_CLOUD_NAME(): string | null {
    return process.env.CLOUDINARY_CLOUD_NAME || null;
  },

  get CLOUDINARY_API_KEY(): string | null {
    return process.env.CLOUDINARY_API_KEY || null;
  },

  get CLOUDINARY_API_SECRET(): string | null {
    return process.env.CLOUDINARY_API_SECRET || null;
  },

  get hasCloudinary(): boolean {
    return Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  },

  // Node environment
  get NODE_ENV(): 'development' | 'production' | 'test' {
    return (process.env.NODE_ENV as any) || 'development';
  },

  get isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  },

  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  },

  get isTest(): boolean {
    return this.NODE_ENV === 'test';
  },
};

/**
 * Initialize environment validation on module import
 * Call this early in your application startup
 */
export function initEnvironment(): void {
  if (process.env.NODE_ENV === 'production') {
    validateEnvironment();
  }
}

// Auto-validate in development to catch missing vars early
if (process.env.NODE_ENV === 'development') {
  try {
    validateEnvironment();
  } catch (error) {
    console.warn('⚠️ Environment validation warning:', (error as Error).message);
  }
}