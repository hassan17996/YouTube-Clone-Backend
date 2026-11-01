import "dotenv/config";

const requiredEnv = [
  "DATABASE_NAME",
  "DATABASE_USER",
  "DATABASE_PASSWORD",
  "JWT_SECRET",
] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (process.env.JWT_SECRET!.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

export const env = {
  jwtSecret: process.env.JWT_SECRET!,
};