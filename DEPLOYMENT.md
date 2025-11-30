# Deployment Guide for MentoriNaja

This guide covers deploying the MentoriNaja React application to a production server with Nginx.

## Prerequisites

- Ubuntu/Debian server with root or sudo access
- Node.js and npm installed
- Nginx installed
- Domain name pointing to your server (mentorinaja.com)

## Step 1: Build the Application

On your local machine or CI/CD pipeline:

```bash
# Install dependencies
npm install

# Build the production bundle
npm run build
```

This creates a `dist` folder with optimized static files.

## Step 2: Transfer Files to Server

Upload the `dist` folder to your server:

```bash
# Using scp
scp -r dist/* user@your-server:/var/www/mentorinaja/dist/

# Or using rsync (recommended)
rsync -avz --delete dist/ user@your-server:/var/www/mentorinaja/dist/
```

## Step 3: Configure Nginx

### 3.1 Backup Existing Configuration (if any)

```bash
sudo cp /etc/nginx/sites-available/mentorinaja /etc/nginx/sites-available/mentorinaja.backup
```

### 3.2 Install the New Configuration

Copy the `nginx.conf` file from this repository to your server and install it:

```bash
# Upload the nginx.conf file to your server
scp nginx.conf user@your-server:/tmp/

# SSH into your server
ssh user@your-server

# Copy to Nginx sites-available directory
sudo cp /tmp/nginx.conf /etc/nginx/sites-available/mentorinaja

# Update the root path in the config if needed
sudo nano /etc/nginx/sites-available/mentorinaja
# Make sure the 'root' directive points to your actual dist folder location
```

### 3.3 Enable the Site

```bash
# Create symbolic link to sites-enabled
sudo ln -s /etc/nginx/sites-available/mentorinaja /etc/nginx/sites-enabled/

# Remove default site if it exists and conflicts
sudo rm /etc/nginx/sites-enabled/default
```

### 3.4 Test and Restart Nginx

```bash
# Test configuration for syntax errors
sudo nginx -t

# If test passes, restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx
```

## Step 4: Set Correct Permissions

Ensure Nginx can read your files:

```bash
sudo chown -R www-data:www-data /var/www/mentorinaja
sudo chmod -R 755 /var/www/mentorinaja
```

## Step 5: Configure SSL with Let's Encrypt (Recommended)

### 5.1 Install Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

### 5.2 Obtain SSL Certificate

```bash
sudo certbot --nginx -d mentorinaja.com -d www.mentorinaja.com
```

Follow the prompts to:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: yes)

Certbot will automatically:
- Obtain the certificate
- Modify your Nginx configuration
- Set up automatic renewal

### 5.3 Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

## Troubleshooting

### Issue: 404 on Page Refresh

**Symptom**: Refreshing pages like `/expert/muhammad-zaki-achsan` returns 404.

**Solution**: Ensure the `try_files` directive is present in your Nginx config:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Issue: Nginx Won't Start

**Check logs**:
```bash
sudo tail -f /var/log/nginx/error.log
```

**Common fixes**:
- Check for syntax errors: `sudo nginx -t`
- Ensure port 80/443 aren't already in use: `sudo netstat -tlnp | grep :80`
- Check file permissions: `ls -la /var/www/mentorinaja`

### Issue: Static Assets Not Loading

**Solution**: Ensure the `root` path in Nginx config is correct:

```bash
# Check if files exist at the configured path
ls -la /var/www/mentorinaja/dist/

# The dist folder should contain:
# - index.html
# - assets/ (JS, CSS files)
# - other static files
```

### Issue: CORS Errors

If you're using Supabase or external APIs, ensure CORS headers are properly configured. The included `nginx.conf` already has basic security headers.

## Deployment Checklist

- [ ] Built application with `npm run build`
- [ ] Transferred `dist` folder to server
- [ ] Configured Nginx with SPA routing support
- [ ] Set correct file permissions
- [ ] Tested Nginx configuration
- [ ] Restarted Nginx
- [ ] Tested all routes (home, expert pages, etc.)
- [ ] Tested page refresh on different routes
- [ ] Obtained SSL certificate
- [ ] Verified HTTPS redirect works
- [ ] Tested auto-renewal of SSL certificate

## Key Configuration Explained

### The Critical Line for SPA Routing

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

This directive:
1. `$uri` - First tries to serve the file directly (e.g., `/logo.png`)
2. `$uri/` - Then tries to serve it as a directory
3. `/index.html` - Finally falls back to `index.html`, letting React Router handle the route

### Caching Strategy

Static assets are cached for 1 year:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

This improves performance by reducing server requests for static files.

## Monitoring and Maintenance

### View Nginx Access Logs

```bash
sudo tail -f /var/log/nginx/access.log
```

### View Nginx Error Logs

```bash
sudo tail -f /var/log/nginx/error.log
```

### Reload Nginx After Config Changes

```bash
# Test first
sudo nginx -t

# Then reload (keeps connections alive)
sudo systemctl reload nginx
```

## Continuous Deployment

For automated deployments, consider:

1. **GitHub Actions** - Build and deploy on push
2. **GitLab CI/CD** - Similar to GitHub Actions
3. **Manual Script** - Simple bash script to build and rsync

Example deployment script:

```bash
#!/bin/bash
set -e

echo "Building application..."
npm install
npm run build

echo "Deploying to server..."
rsync -avz --delete dist/ user@your-server:/var/www/mentorinaja/dist/

echo "Deployment complete!"
```

## Environment Variables

If your app uses environment variables:

1. Create `.env.production` file locally
2. Build with production variables: `npm run build`
3. The build process will embed variables in the bundle

**Note**: Never commit `.env` files to version control. Add them to `.gitignore`.

## Support

For issues specific to:
- **React Router**: Check [React Router Documentation](https://reactrouter.com)
- **Nginx**: Check [Nginx Documentation](https://nginx.org/en/docs/)
- **Let's Encrypt**: Check [Certbot Documentation](https://certbot.eff.org/)
