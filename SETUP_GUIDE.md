# Setup Guide for College Event Management System

## Environment Setup

1. **Copy environment variables:**
   ```bash
   cp env.example .env.local
   ```

2. **Update .env.local with your Supabase credentials:**
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_ADMIN_EMAIL=admin@college.edu
   ```

## Database Setup

1. **Run the migration in your Supabase SQL editor:**
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and execute in Supabase SQL editor

2. **Create storage buckets:**
   - `profile-photos`
   - `event-photos`
   - `workshop-photos`
   - `combo-photos`

## First Admin User

1. **Create a user through Supabase Auth:**
   - Go to Authentication > Users in Supabase dashboard
   - Add a new user with email matching `VITE_ADMIN_EMAIL`

2. **Set admin role:**
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'admin@college.edu';
   ```

## Testing Login

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test login with:**
   - Email: `admin@college.edu`
   - Password: (the password you set in Supabase Auth)

3. **Check browser console for debugging info**

## Troubleshooting

### Login not redirecting:
- Check browser console for errors
- Verify environment variables are set correctly
- Ensure user has admin role in database
- Check Supabase connection in browser console

### Environment variables not working:
- Make sure `.env.local` file exists in project root
- Restart the development server after changing environment variables
- Check that variable names start with `VITE_`

### Database connection issues:
- Verify Supabase URL and anon key are correct
- Check if RLS policies are blocking access
- Ensure database tables exist and are properly configured 