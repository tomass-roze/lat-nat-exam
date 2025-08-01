# Deployment Guide - Latvian Citizenship Exam App

## Overview

This guide covers the complete deployment setup for the Latvian Citizenship Naturalization Exam web application using Vercel as the hosting platform.

## 🚀 Quick Start

### Prerequisites

- [Vercel account](https://vercel.com) (free tier sufficient)
- GitHub repository access
- Domain access for naturalizacijastests.lv (if using custom domain)

### 1. Vercel Account Setup

1. **Create Vercel Account**
   - Visit [vercel.com](https://vercel.com)
   - Sign up using GitHub account for seamless integration
   - Confirm email verification

2. **Connect GitHub Repository**
   - Go to Vercel Dashboard → "Import Project"
   - Select GitHub as source
   - Find and import `lat-nat-exam` repository
   - Grant necessary permissions

### 2. Project Configuration

#### Automatic Configuration
Vercel will automatically detect the Vite framework and use the `vercel.json` configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

#### Manual Configuration (if needed)
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node.js Version**: 18.x or 20.x

### 3. Environment Variables

No environment variables are required for the basic deployment. Future enhancements may require:

```bash
# Optional future variables
NODE_ENV=production
VITE_APP_VERSION=1.0.0
```

## 🔒 Security Configuration

### Security Headers

The `vercel.json` file includes comprehensive security headers:

- **Content Security Policy (CSP)**: Protects against XSS attacks
- **X-Frame-Options**: Prevents clickjacking (set to DENY)
- **Strict Transport Security (HSTS)**: Enforces HTTPS
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **Referrer Policy**: Controls referrer information
- **Permissions Policy**: Restricts browser features

### CSP Configuration

```
default-src 'self'; 
script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
style-src 'self' 'unsafe-inline' fonts.googleapis.com; 
font-src 'self' fonts.gstatic.com; 
img-src 'self' data: blob:; 
connect-src 'self'
```

**Note**: `unsafe-inline` is required for Tailwind CSS classes.

## 🌐 Custom Domain Setup

### DNS Configuration

1. **In Vercel Dashboard**:
   - Go to Project Settings → Domains
   - Add `naturalizacijastests.lv`
   - Choose configuration type (recommended: CNAME)

2. **DNS Provider Settings**:
   ```
   Type: CNAME
   Name: naturalizacijastests.lv (or @)
   Value: cname.vercel-dns.com
   TTL: 300 (or default)
   ```

3. **Subdomain Redirect**:
   ```
   Type: CNAME
   Name: www
   Value: naturalizacijastests.lv
   TTL: 300
   ```

### SSL Certificate

- Automatic HTTPS certificate from Let's Encrypt
- Automatic renewal handled by Vercel
- Certificate valid for both root and www subdomains
- HSTS enforced via security headers

## 🔧 Build Optimization

### Production Build Features

- **Source Maps**: Disabled in production for smaller bundles
- **Asset Hashing**: Automatic cache-busting with content hashes
- **Chunk Splitting**: Manual vendor chunks for optimal caching
- **Minification**: Esbuild for fast, efficient minification
- **Tree Shaking**: Automatic dead code elimination

### Caching Strategy

```json
{
  "source": "/assets/(.*)",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "public, max-age=31536000, immutable"
    }
  ]
}
```

### Bundle Analysis

Run bundle analysis locally:
```bash
ANALYZE_BUNDLE=true npm run build
```

This generates `dist/stats.html` with detailed bundle information.

## 📊 Performance Targets

### Current Performance
- **Bundle Size**: ~337KB (101KB gzipped)
- **Build Time**: ~3 seconds
- **Load Time Target**: < 2 seconds
- **Core Web Vitals**: Green range target

### Optimization Features
- Manual chunk splitting for vendor libraries
- Static asset optimization
- Efficient Tailwind CSS purging
- React vendor chunk separation

## 🚢 Deployment Pipeline

### Automatic Deployment

1. **Production Deployment**:
   - Push to `master` branch
   - Automatic build and deployment
   - Live at custom domain (when configured)

2. **Preview Deployments**:
   - Push to any feature branch
   - Unique preview URL generated
   - Comment on Pull Requests with preview link

3. **Build Process**:
   ```bash
   npm install          # Install dependencies
   npm run build        # TypeScript compilation + Vite build
   # Deploy to Vercel edge network
   ```

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 📈 Monitoring & Analytics

### Built-in Vercel Features

- **Web Vitals**: Core Web Vitals monitoring
- **Function Logs**: Build and runtime logs
- **Analytics**: Traffic and performance metrics
- **Edge Caching**: Global CDN statistics

### Access Monitoring

1. **Vercel Dashboard**:
   - Go to project → Analytics tab
   - View Web Vitals, traffic, and performance data

2. **Web Vitals Monitoring**:
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)

## 🔍 Testing & Validation

### Pre-deployment Testing

```bash
# Build and test locally
npm run build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Unit tests
npm run test
```

### Security Validation

Test security headers:
- [SecurityHeaders.com](https://securityheaders.com)
- [Mozilla Observatory](https://observatory.mozilla.org)

### Performance Testing

- [PageSpeed Insights](https://pagespeed.web.dev)
- [WebPageTest](https://www.webpagetest.org)
- Lighthouse (built into Chrome DevTools)

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check TypeScript errors
   npm run type-check
   
   # Fix linting issues
   npm run lint:fix
   ```

2. **CSP Violations**:
   - Check browser console for CSP errors
   - Adjust CSP in `vercel.json` if needed
   - Common issue: external resources not whitelisted

3. **Routing Issues**:
   - Ensure `rewrites` configuration in `vercel.json`
   - All client-side routes should serve `index.html`

4. **Performance Issues**:
   ```bash
   # Analyze bundle
   ANALYZE_BUNDLE=true npm run build
   
   # Check for large dependencies
   npx webpack-bundle-analyzer dist/stats.html
   ```

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- Project Issues: [GitHub Issues](https://github.com/tomass-roze/lat-nat-exam/issues)

## 📋 Maintenance

### Regular Tasks

1. **Weekly**:
   - Monitor Web Vitals scores
   - Check for any 4xx/5xx errors
   - Review performance metrics

2. **Monthly**:
   - Update dependencies
   - Security header validation
   - Performance optimization review

3. **Quarterly**:
   - Vercel plan usage review
   - Domain renewal check (if applicable)
   - Backup and disaster recovery test

### Updates and Rollbacks

- **Updates**: Push to master branch for automatic deployment
- **Rollbacks**: Use Vercel dashboard "Redeploy" previous version
- **Hotfixes**: Create hotfix branch → PR → immediate merge for critical issues

## 🎯 Success Criteria

- ✅ Build completes without errors
- ✅ All security headers properly configured
- ✅ Custom domain with valid SSL certificate
- ✅ Performance metrics in green range
- ✅ Web Vitals scores optimized
- ✅ Latvian text rendering works correctly
- ✅ All exam functionality operational

---

**Deployment Status**: Ready for production  
**Platform**: Vercel  
**Domain**: naturalizacijastests.lv (pending DNS configuration)  
**SSL**: Automatic (Let's Encrypt)  
**CDN**: Global edge network included