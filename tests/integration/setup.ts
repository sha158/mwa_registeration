import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })
config({ path: '.env.test.local', quiet: true })

for (const key of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'TEST_ADMIN_EMAIL', 'TEST_ADMIN_PASSWORD']) {
  if (!process.env[key]) throw new Error(`Integration tests need ${key} (.env.local / .env.test.local)`)
}
