#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Setting up environment variables...\n');

const envExamplePath = path.join(__dirname, 'env.example');
const envLocalPath = path.join(__dirname, '.env.local');

// Check if .env.local already exists
if (fs.existsSync(envLocalPath)) {
  console.log('✅ .env.local already exists');
  console.log('📝 Please make sure it contains the correct Supabase credentials:\n');
  console.log('VITE_SUPABASE_URL=your_supabase_url');
  console.log('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.log('VITE_ADMIN_EMAIL=admin@college.edu\n');
} else {
  // Copy from env.example
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envLocalPath, envContent);
    console.log('✅ Created .env.local from env.example');
    console.log('📝 Please update .env.local with your actual Supabase credentials\n');
  } else {
    console.log('❌ env.example not found');
    console.log('📝 Please create .env.local manually with:\n');
    console.log('VITE_SUPABASE_URL=your_supabase_url');
    console.log('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
    console.log('VITE_ADMIN_EMAIL=admin@college.edu\n');
  }
}

console.log('🚀 Next steps:');
console.log('1. Update .env.local with your Supabase credentials');
console.log('2. Run: npm run dev');
console.log('3. Open browser console to see debug information');
console.log('4. Click "Test Connection" button on login page');
console.log('5. Try logging in with admin@college.edu\n');

console.log('🔍 If you see "Missing Supabase environment variables" in console:');
console.log('- Make sure .env.local exists in the project root');
console.log('- Make sure variable names start with VITE_');
console.log('- Restart the development server after creating .env.local');
