# Vercel Deployment Guide

## Quick Setup

1. **Connect your repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect it's a Vite React app

2. **Build Settings:**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Environment Variables (if needed):**
   - Add any environment variables in Vercel dashboard
   - Example: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Configuration Files

The following files are already configured for Vercel:

- `vercel.json` - Main Vercel configuration
- `public/_redirects` - Fallback redirects
- `vite.config.js` - Build configuration

## Key Features

✅ **SPA Routing**: All routes redirect to `index.html` for client-side routing
✅ **Static Assets**: Proper caching headers for JS, CSS, images
✅ **Security Headers**: XSS protection, content type options
✅ **Build Optimization**: Single chunk output for better loading

## Testing

After deployment, test these scenarios:
- [ ] Navigate to `/admin/dashboard` and refresh the page
- [ ] Navigate to `/user` and refresh the page  
- [ ] Navigate to `/login` and refresh the page
- [ ] All routes should work without 404 errors

## Troubleshooting

If you still get 404 errors:
1. Check that `vercel.json` is in the root directory
2. Verify the build output directory is `dist`
3. Clear Vercel cache and redeploy
4. Check Vercel function logs for any build errors
