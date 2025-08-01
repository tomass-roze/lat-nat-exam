# Latvian Citizenship Naturalization Exam Practice App

A modern web application for practicing the Latvian citizenship naturalization examination, built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern Tech Stack**: Built with React 19, TypeScript, and Vite for optimal performance
- **Tailwind CSS v4**: Latest version with improved build speed and modern features
- **UTF-8 Support**: Full support for Latvian diacritical characters (ā, č, ē, ģ, ī, ķ, ļ, ņ, š, ū, ž)
- **Responsive Design**: Mobile-first approach working across all device sizes
- **Accessibility**: WCAG compliant with proper semantic HTML and ARIA labels
- **Development Tools**: ESLint, Prettier, and TypeScript for code quality

## 🏗️ Project Structure

```
src/
├── components/         # Reusable UI components
│   └── LatvianTextTest/   # UTF-8 character testing component
├── pages/             # Page components
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
├── types/             # TypeScript type definitions
├── styles/            # CSS and styling files
└── assets/            # Static assets
```

## 🛠️ Prerequisites

- Node.js 18+ (currently using v20.17.0)
- npm 8+ (currently using v11.4.2)

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/tomass-roze/lat-nat-exam.git
cd lat-nat-exam
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run test suite
- `npm run test:e2e` - Run end-to-end tests

## 🎯 Exam Structure

The application will support three assessment sections:

1. **National Anthem** (75% accuracy required)
   - Multi-line textarea for 8 lines of the Latvian national anthem
   - Character-by-character comparison with official text
   - Real-time accuracy feedback

2. **History Questions** (7/10 correct required)
   - 10 randomly selected questions from a pool of 20+
   - Multiple-choice format with 3 options each
   - Randomized question and answer order

3. **Constitution Questions** (5/8 correct required)
   - 8 randomly selected questions from a pool of 16+
   - Multiple-choice format with 3 options each
   - Randomized question and answer order

## 🌍 Internationalization

- Full UTF-8 support for Latvian characters
- All interface text in Latvian language
- Proper character encoding throughout the application
- Font optimization for Latvian diacritical marks

## 🧪 Testing

The project includes a comprehensive Latvian character test component that verifies:

- Proper rendering of all Latvian diacritical characters
- UTF-8 encoding functionality
- Font compatibility across different typefaces
- Input field support for Latvian text

## 🔧 Technical Details

### Tech Stack

- **React 19**: Latest version with improved performance and features
- **TypeScript**: Full type safety and enhanced developer experience
- **Vite**: Fast build tool with hot module replacement
- **Tailwind CSS v4**: Latest version with performance improvements
- **ESLint + Prettier**: Code quality and formatting tools

### Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Performance Targets

- Initial page load: < 2 seconds
- Development server startup: < 3 seconds
- Hot reload: < 100ms response time
- Production build: Optimized and minified

## 🤝 Contributing

1. Follow the existing code style (ESLint + Prettier)
2. Ensure TypeScript compilation passes
3. Test Latvian character rendering
4. Write meaningful commit messages

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Related Issues

This project is tracked using GitHub Issues:

- [Issue #1](https://github.com/tomass-roze/lat-nat-exam/issues/1) - Initialize Project with Modern TypeScript React Stack ✅
- [Issue #2](https://github.com/tomass-roze/lat-nat-exam/issues/2) - Install and Configure Shadcn/ui Component System
- Additional issues track the complete implementation roadmap

## 🚀 Deployment

The application is configured for deployment on **Vercel** with production optimizations.

### Quick Deploy

1. **Vercel Platform** (Recommended)
   - Connect GitHub repository to Vercel
   - Automatic deployments from `master` branch
   - Preview deployments for feature branches
   - Built-in CDN and edge caching

2. **Custom Domain**: naturalizacijastests.lv
   - Automatic HTTPS with Let's Encrypt
   - Global CDN distribution
   - Security headers configured

3. **Production Build**
   ```bash
   npm run build  # Optimized production build
   npm run preview # Test production build locally
   ```

### Performance
- **Bundle Size**: ~337KB (101KB gzipped)
- **Build Time**: ~3 seconds
- **Target Load Time**: < 2 seconds
- **Core Web Vitals**: Green range optimized

For detailed deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 📈 Project Status

✅ **Phase 1 Complete**: Modern React TypeScript foundation with Tailwind CSS v4 and UTF-8 support  
✅ **Phase 2 Complete**: shadcn/ui component system integration  
✅ **Phase 3 Complete**: Production deployment configuration  

**Current Status**: Ready for production deployment

**Architecture**: 
- Frontend: React 19 + TypeScript + Vite
- UI Components: shadcn/ui + Radix UI + Tailwind CSS v4
- Deployment: Vercel with optimized build pipeline
- Security: Comprehensive security headers and CSP

---

**Built with ❤️ for the Latvian community**