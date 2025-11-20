# Migrate to intellic-health-platform Repository

## Quick Migration Steps

### Option 1: Copy Web Directory (Recommended)

This creates a clean repository with just your INTELLIC Health app (no template history):

```bash
# 1. Initialize the new repo on GitHub first
# Go to: https://github.com/KCJMP23/intellic-health-platform
# Add a README.md (this initializes the repo)

# 2. Clone the new empty repo
cd ~
git clone https://github.com/KCJMP23/intellic-health-platform.git
cd intellic-health-platform

# 3. Copy all files from the web directory
cp -r ~/spezitemplateapplication/web/* .
cp -r ~/spezitemplateapplication/web/.* . 2>/dev/null || true

# 4. Remove the old README and create new one
rm -f README.md

# 5. Create INTELLIC-specific README
cat > README.md << 'EOF'
# INTELLIC x Precognitive Health Platform

A comprehensive digital health platform for real-time health data streaming, monitoring, and analysis.

## Features

- 🍎 **Apple Health Integration** - Stream data from Apple Watch and iPhone Health app
- ⚖️ **Withings Devices** - Sync weight scales, BP monitors, and more
- 🏥 **Epic MyChart** - Access EHR data via SMART on FHIR
- 📊 **Real-time Dashboards** - Visualize health metrics with interactive charts
- 📱 **Cross-platform** - iOS, Android, and Web PWA
- 🔒 **HIPAA Compliant** - Healthcare-grade security and privacy
- 🔄 **Auto-sync** - Background data synchronization
- 📈 **FHIR R4** - Standardized health data format

## Quick Start

See [QUICK_START.md](QUICK_START.md) for detailed setup instructions.

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Mobile

```bash
# Android
npm run build
npx cap sync
npx cap run android

# iOS (macOS only)
npm run build
npx cap add ios
npx cap sync
npx cap open ios
```

## Documentation

- [Quick Start Guide](QUICK_START.md) - Get started in 5 minutes
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Production deployment
- [Module Configuration](IntellicConfigWizard.md) - Configure health modules

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Material-UI (MUI)
- **Mobile**: Capacitor 6
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Health Standards**: FHIR R4, SMART on FHIR
- **APIs**: Apple HealthKit, Withings, Epic MyChart

## Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- Firebase credentials (for data persistence)
- Epic Client ID (for EHR integration)
- Withings API credentials (for device sync)

## Project Structure

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
│   ├── hooks/               # React hooks
│   ├── utils/               # Utilities
│   └── types/               # TypeScript type definitions
├── android/                 # Android native project
├── ios/                     # iOS native project (macOS only)
└── public/                  # Static assets
```

## Contributing

This is a private health platform. For issues or feature requests, please contact the development team.

## License

Proprietary - INTELLIC x Precognitive Health

## Support

For setup help, see [QUICK_START.md](QUICK_START.md) or contact the development team.

---

Built with ❤️ by INTELLIC x Precognitive Health

Inspired by [Stanford Spezi](https://spezi.stanford.edu)
EOF

# 6. Create .gitignore if it doesn't exist
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output

# Production
dist/
build/

# Misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Editor
.idea/
.vscode/
*.swp
*.swo
*~

# OS
Thumbs.db

# Capacitor
android/
ios/
.capacitor/

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log

# Environment
.env
.env.local

# Build
dist-ssr
*.local

# Vite
.vite/
EOF

# 7. Initial commit
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
- Device connection management UI

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

### Documentation
- Comprehensive quick start guide
- Deployment guide for production
- Module configuration wizard
- API integration examples

## Getting Started

See QUICK_START.md for setup instructions.

---

Migrated from Stanford Spezi template architecture
Built for INTELLIC x Precognitive Health"

# 8. Push to GitHub
git branch -M main
git push -u origin main

echo "✅ Migration complete!"
echo "🌐 View your repo: https://github.com/KCJMP23/intellic-health-platform"
```

---

### Option 2: Push Current Branch (Keep Git History)

If you want to keep the full git history from the template migration:

```bash
# 1. Go to your current repo
cd ~/spezitemplateapplication

# 2. Add the new remote
git remote add intellic https://github.com/KCJMP23/intellic-health-platform.git

# 3. Push your current branch as main
git push intellic claude/migrate-to-react-pwa-01QthqCsnxBNo6XL5y28eUPW:main

# 4. (Optional) Push web directory only to keep it clean
git subtree push --prefix=web intellic main
```

---

## Recommended: Option 1 (Clean Repository)

Option 1 is recommended because:
- ✅ Clean git history starting with INTELLIC
- ✅ No template remnants (iOS folder, etc.)
- ✅ Professional commit history
- ✅ Root directory is the app (not web/ subdirectory)
- ✅ Better for deployment (Vercel, Netlify)

## After Migration

1. **Update Vercel/Deployment**:
   ```bash
   cd ~/intellic-health-platform
   vercel
   # Follow prompts to link new repo
   ```

2. **Update Epic Redirect URI**:
   - New domain will be: `https://intellic-health-platform.vercel.app`
   - Update in Epic App Orchard
   - Update in `.env`: `VITE_EPIC_REDIRECT_URI=https://intellic-health-platform.vercel.app/epic/callback`

3. **Configure Secrets**:
   - Don't commit `.env` file
   - Add environment variables in Vercel dashboard
   - Keep `.env.example` for documentation

4. **Clean Up Old Repo** (optional):
   - Archive or delete `spezitemplateapplication` repo
   - Update any documentation links

---

## Troubleshooting

### "Repository not found" error
- Make sure the repo exists on GitHub
- Check you're logged in: `gh auth status`
- Initialize repo with a README first on GitHub

### Permission denied
- Check SSH keys: `ssh -T git@github.com`
- Or use HTTPS with personal access token

### Can't access new repo through proxy
- The repo might need to be initialized first (add README on GitHub)
- Try again in a few minutes after GitHub processes the new repo

---

**Ready to migrate?** Run Option 1 commands above! 🚀
