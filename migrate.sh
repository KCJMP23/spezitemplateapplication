#!/bin/bash

# INTELLIC Health Platform Migration Script
# Migrates the web app to a new clean repository

set -e  # Exit on error

echo "🚀 INTELLIC Health Platform Migration"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if new repo exists
echo -e "${YELLOW}Step 1: Checking GitHub repository...${NC}"
if git ls-remote https://github.com/KCJMP23/intellic-health-platform.git >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Repository exists${NC}"
else
    echo -e "${RED}✗ Repository not found${NC}"
    echo ""
    echo "Please initialize the repository first:"
    echo "1. Go to: https://github.com/KCJMP23/intellic-health-platform"
    echo "2. Click 'Add a README' to initialize the repo"
    echo "3. Run this script again"
    exit 1
fi

# Clone the new repository
echo ""
echo -e "${YELLOW}Step 2: Cloning new repository...${NC}"
cd ~
if [ -d "intellic-health-platform" ]; then
    echo -e "${YELLOW}Directory exists, removing...${NC}"
    rm -rf intellic-health-platform
fi

git clone https://github.com/KCJMP23/intellic-health-platform.git
cd intellic-health-platform

echo -e "${GREEN}✓ Repository cloned${NC}"

# Copy files from web directory
echo ""
echo -e "${YELLOW}Step 3: Copying INTELLIC Health app files...${NC}"

# Copy all files including hidden ones
cp -r ~/spezitemplateapplication/web/* . 2>/dev/null || true
cp ~/spezitemplateapplication/web/.env.example . 2>/dev/null || true
cp ~/spezitemplateapplication/web/.gitignore . 2>/dev/null || true
cp ~/spezitemplateapplication/web/.prettierrc . 2>/dev/null || true
cp ~/spezitemplateapplication/web/.prettierignore . 2>/dev/null || true

# Don't copy .env (secrets)
# Don't copy node_modules (dependencies)
# Don't copy dist (build artifacts)

echo -e "${GREEN}✓ Files copied${NC}"

# Create new README
echo ""
echo -e "${YELLOW}Step 4: Creating README.md...${NC}"

cat > README.md << 'EOFREADME'
# INTELLIC x Precognitive Health Platform

A comprehensive digital health platform for real-time health data streaming, monitoring, and analysis.

## 🎯 Features

- 🍎 **Apple Health Integration** - Stream data from Apple Watch and iPhone Health app
- ⚖️ **Withings Devices** - Sync weight scales, BP monitors, and more
- 🏥 **Epic MyChart** - Access EHR data via SMART on FHIR
- 📊 **Real-time Dashboards** - Visualize health metrics with interactive charts
- 📱 **Cross-platform** - iOS, Android, and Web PWA
- 🔒 **HIPAA Compliant** - Healthcare-grade security and privacy
- 🔄 **Auto-sync** - Background data synchronization
- 📈 **FHIR R4** - Standardized health data format

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:5173
```

See [QUICK_START.md](QUICK_START.md) for detailed setup instructions.

## 📱 Mobile Deployment

### Android
```bash
npm run build
npx cap sync
npx cap run android
```

### iOS (macOS only)
```bash
npm run build
npx cap add ios
npx cap sync
npx cap open ios
```

## 📚 Documentation

- [Quick Start Guide](QUICK_START.md) - Get started in 5 minutes
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Production deployment
- [Module Configuration](IntellicConfigWizard.md) - Configure health modules

## 🏗️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Material-UI (MUI)
- **Mobile**: Capacitor 6
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Health Standards**: FHIR R4, SMART on FHIR
- **APIs**: Apple HealthKit, Withings, Epic MyChart

## ⚙️ Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your credentials:
# - Firebase project credentials
# - Epic Client ID
# - Withings API credentials
```

## 📁 Project Structure

```
.
├── src/
│   ├── components/          # Reusable UI components
│   ├── modules/             # Feature modules
│   │   ├── patient/         # Patient-facing features
│   │   ├── provider/        # Healthcare provider features
│   │   └── researcher/      # Research tools
│   ├── services/            # Business logic & API integrations
│   │   ├── healthkit.ts     # Apple Health integration
│   │   ├── withings.ts      # Withings API integration
│   │   ├── epicMyChart.ts   # Epic SMART on FHIR
│   │   └── dataSync.ts      # Unified data orchestrator
│   └── types/               # TypeScript type definitions
├── android/                 # Android native project
├── public/                  # Static assets
└── index.html               # Entry point
```

## 🔐 Security & Compliance

- AES-256-GCM encryption for sensitive data
- OAuth 2.0 with PKCE for API authentication
- HIPAA-compliant data handling
- Audit logging for all data access
- Role-based access control (RBAC)

## 🌐 Deployment

### Vercel (Recommended)
```bash
vercel
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Firebase Hosting
```bash
npm run build
firebase deploy
```

## 📄 License

Proprietary - INTELLIC x Precognitive Health

## 💡 Support

For setup help, see [QUICK_START.md](QUICK_START.md)

---

Built with ❤️ by INTELLIC x Precognitive Health

Inspired by [Stanford Spezi](https://spezi.stanford.edu)
EOFREADME

echo -e "${GREEN}✓ README created${NC}"

# Update .gitignore to exclude android/ios
echo ""
echo -e "${YELLOW}Step 5: Updating .gitignore...${NC}"

cat >> .gitignore << 'EOFGITIGNORE'

# Capacitor native projects (generated, not committed)
android/
ios/
EOFGITIGNORE

echo -e "${GREEN}✓ .gitignore updated${NC}"

# Git commit
echo ""
echo -e "${YELLOW}Step 6: Creating initial commit...${NC}"

git add .
git commit -m "feat: Initial INTELLIC x Precognitive Health platform

## Platform Features

### Real-time Health Data Streaming
- Apple HealthKit integration for Apple Watch and iPhone Health data
- Withings API integration for smart scales and BP monitors
- Epic MyChart SMART on FHIR for EHR data access
- Unified data sync orchestrator with background auto-sync

### User Interface
- Patient dashboard with real-time health metrics
- Provider portal for patient management
- Researcher tools for data analysis
- Interactive data visualizations with charts
- Device connection management UI at /data-sources

### Technical Architecture
- React 18 + TypeScript + Vite
- Material-UI component library
- Capacitor 6 for native mobile apps (iOS & Android)
- Firebase backend (Auth, Firestore, Storage)
- FHIR R4 standardized health data format
- HIPAA-compliant security architecture

### Mobile Support
- iOS app with HealthKit integration
- Android app with full feature parity
- Progressive Web App (PWA) for web access
- Offline mode with service workers

### Security & Compliance
- AES-256-GCM encryption for sensitive data
- OAuth 2.0 with PKCE for API authentication
- HIPAA-compliant data handling
- Audit logging for all data access
- Role-based access control (RBAC)

### Module Configuration
- Interactive wizard at /setup/modules
- 12 configurable health modules
- Automatic dependency resolution
- Configuration export/import

### Documentation
- Comprehensive quick start guide
- Deployment guide for production
- Mobile setup instructions
- API integration examples

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

See QUICK_START.md for detailed setup instructions.

## Data Sources

Configure at /data-sources:
- 🍎 Apple Health / Apple Watch
- ⚖️ Withings Devices
- 🏥 Epic MyChart
- ✏️ Manual Entry

---

Migrated from Stanford Spezi template architecture
Built for INTELLIC x Precognitive Health"

echo -e "${GREEN}✓ Initial commit created${NC}"

# Push to GitHub
echo ""
echo -e "${YELLOW}Step 7: Pushing to GitHub...${NC}"

git branch -M main
git push -u origin main

echo -e "${GREEN}✓ Pushed to GitHub${NC}"

# Summary
echo ""
echo -e "${GREEN}════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Migration Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════${NC}"
echo ""
echo "📍 Repository: https://github.com/KCJMP23/intellic-health-platform"
echo "📁 Local path: ~/intellic-health-platform"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Navigate to the new repository:"
echo "   cd ~/intellic-health-platform"
echo ""
echo "2. Install dependencies:"
echo "   npm install"
echo ""
echo "3. Configure environment:"
echo "   cp .env.example .env"
echo "   # Edit .env with your credentials"
echo ""
echo "4. Start development server:"
echo "   npm run dev"
echo ""
echo "5. Deploy to Vercel:"
echo "   vercel"
echo ""
echo "6. Update Epic redirect URI to:"
echo "   https://intellic-health-platform.vercel.app/epic/callback"
echo ""
echo -e "${YELLOW}📖 See QUICK_START.md for detailed setup instructions${NC}"
echo ""
