# WhatsApp Token Setup - Quick Fix

## Issue
You're getting "invalid token" error because the environment variable isn't properly configured.

## Solution

### Step 1: Create .env.local file
Create a file named `.env.local` in your project root with this content:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://skmrqcgajorluaaqrdvk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrbXJxY2dham9ybHVhYXFyZHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjE3NzYsImV4cCI6MjA3MDYzNzc3Nn0.mZuP-ew_6PwLy2Za4Q0w7RcxmbBRbp6yJ-Hv9gKV-jQ

# WhatsApp Configuration (Fonnte API)
VITE_FONNTE_TOKEN=YVkFmsTxUYa8pPHJZZxh
```

### Step 2: Restart Development Server
After creating the `.env.local` file:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Test the Connection
Open browser console and run:
```javascript
// Test the WhatsApp connection
import { testWhatsAppConnection } from './src/lib/whatsappService.js'
testWhatsAppConnection()
```

### Step 4: Verify Token is Loaded
Check the browser console for these logs:
- "Fonnte Token: Loaded"
- "Token value: YVkFmsTxUYa8pPHJZZxh"

## For Vercel Deployment

Add this environment variable in your Vercel dashboard:
- **Name**: `VITE_FONNTE_TOKEN`
- **Value**: `YVkFmsTxUYa8pPHJZZxh`

## Troubleshooting

### If still getting "invalid token":
1. **Check Fonnte Dashboard**: Verify your token is active
2. **Check WhatsApp Connection**: Ensure your WhatsApp is connected to Fonnte
3. **Check Quota**: Verify you have remaining messages in your Fonnte account
4. **Check Phone Format**: Ensure phone numbers are valid Indian numbers

### Common Issues:
- **Token expired**: Get a new token from Fonnte
- **WhatsApp disconnected**: Reconnect your WhatsApp in Fonnte dashboard
- **Insufficient quota**: Top up your Fonnte account
- **Wrong phone format**: Use 10-digit Indian numbers (e.g., 9876543210)

## Test Message Format
The system will automatically format phone numbers:
- Input: `9876543210`
- Formatted: `919876543210` (with +91 country code)

## Debug Information
The updated service now includes detailed logging:
- Token loading status
- Phone number formatting
- API payload
- Response details

Check browser console for detailed debug information.
