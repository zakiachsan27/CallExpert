# CallExpert Deployment Guide

This guide covers deploying the CallExpert platform to production.

## Pre-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Supabase project configured
- [ ] Environment variables set
- [ ] At least one expert account created
- [ ] Test user registration and booking flow
- [ ] Test expert login and dashboard
- [ ] Storage buckets configured and tested
- [ ] RLS policies verified

## Environment Setup

### Production Environment Variables

Create `.env.production`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

**Important:** Never commit `.env` files to version control!

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
npm run build
vercel --prod
```

3. **Configure Environment Variables:**
   - Go to Vercel project dashboard
   - Settings > Environment Variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Option 2: Netlify

1. **Build the project:**
```bash
npm run build
```

2. **Deploy to Netlify:**
   - Drag and drop the `build` folder to Netlify
   - Or use Netlify CLI:
```bash
npm i -g netlify-cli
netlify deploy --prod
```

3. **Configure Environment Variables** in Netlify dashboard

### Option 3: Self-Hosted (VPS)

1. **Build the project:**
```bash
npm run build
```

2. **Set up a web server (Nginx example):**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/callexpert/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

3. **Upload build files to server**
4. **Configure SSL with Let's Encrypt**

## Post-Deployment

### 1. Verify Deployment

- [ ] Homepage loads correctly
- [ ] Expert list displays
- [ ] User can register and login
- [ ] Expert can login
- [ ] Booking flow works
- [ ] Images upload correctly

### 2. Configure Supabase

#### Update Auth Redirect URLs

In Supabase dashboard > Authentication > URL Configuration:

```
Site URL: https://your-domain.com
Redirect URLs:
  - https://your-domain.com
  - https://your-domain.com/login
  - https://your-domain.com/expert/login
```

#### Configure Email Templates

Customize email templates for:
- User confirmation
- Password reset
- Expert invitation

### 3. Security

#### Enable Email Confirmation

In Supabase dashboard > Authentication > Settings:
- Enable "Email Confirmations"
- Set "Confirmation Email Template"

#### Configure CORS

In Supabase dashboard > Settings > API:
- Add your production domain to CORS allowed origins

#### Rate Limiting

Configure rate limits in Supabase to prevent abuse.

### 4. Monitoring

#### Set Up Error Tracking

Install Sentry or similar:
```bash
npm install @sentry/react
```

#### Monitor Supabase Usage

Check Supabase dashboard for:
- Database usage
- Storage usage
- API requests
- Auth users count

## Scaling Considerations

### Database

- Monitor query performance
- Add indexes as needed
- Consider connection pooling for high traffic

### Storage

- Set up CDN for images (Supabase Storage is CDN-backed)
- Implement image optimization
- Set appropriate cache headers

### Authentication

- Monitor auth usage
- Consider implementing rate limiting
- Set up MFA for admin accounts

## Backup Strategy

### Database Backups

Supabase provides automated daily backups on paid plans.

Manual backup:
```sql
-- Use pg_dump via Supabase CLI or dashboard
```

### Storage Backups

- Download storage bucket contents periodically
- Consider versioning for critical files

## Rollback Plan

If deployment fails:

1. **Revert to previous version:**
   - Vercel: Use deployment rollback in dashboard
   - Netlify: Restore previous deployment

2. **Database rollback:**
   - Restore from backup if migrations failed
   - Use Supabase point-in-time recovery

## Troubleshooting

### Build Fails

```bash
# Clear node_modules and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Loading

- Check variable names start with `VITE_`
- Rebuild after changing env vars
- Verify platform-specific env var syntax

### Database Connection Issues

- Verify Supabase URL is correct
- Check anon key is valid
- Ensure RLS policies allow necessary operations

## CI/CD Setup (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## Cost Optimization

### Supabase

- Start with Free tier
- Monitor usage
- Upgrade to Pro when needed

### Hosting

- Vercel/Netlify free tiers are generous
- Use CDN for static assets
- Enable caching

## Support & Maintenance

- Monitor error logs regularly
- Keep dependencies updated
- Review security advisories
- Backup database weekly
- Test critical flows monthly

---

**Last Updated:** November 2024

