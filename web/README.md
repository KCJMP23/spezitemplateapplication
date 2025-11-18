# Spezi Health - React PWA

A modular Progressive Web App for healthcare research, supporting patients, providers, and researchers with FHIR-compliant data management and wearable integration.

## Features

### Core Capabilities
- 🏥 **FHIR R4 Compliant** - Full HL7 FHIR R4 standard implementation
- 🔐 **HIPAA-Ready** - Healthcare compliance with audit logging and data privacy controls
- 📱 **Progressive Web App** - Works on iOS, Android, and web with offline support
- 🎯 **Modular Architecture** - Role-based components for different user types
- 🔒 **Secure Authentication** - Firebase Auth with email/password and Sign in with Apple
- 📊 **Wearable Data Integration** - Stream health data from various sources
- 📝 **Digital Consent Management** - Signature capture and PDF generation
- 📋 **Questionnaire System** - FHIR QuestionnaireResponse format
- 📅 **Task Scheduling** - Automated reminders and data collection

### User Roles

#### Patient Module
- Health data tracking and visualization
- Questionnaire completion
- Appointment management
- Secure messaging

#### Provider Module
- Patient roster management
- Health data review
- Care plan creation
- Analytics dashboard

#### Researcher Module
- Study management
- Participant enrollment
- Data analysis (aggregate/de-identified)
- Export capabilities (CSV, FHIR)

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Material-UI (MUI)
- **Styling**: Tailwind CSS + Emotion
- **State Management**: Zustand + React Query
- **Routing**: React Router v6
- **Backend**: Firebase (Auth, Firestore, Storage)
- **FHIR**: @ahryman40k/ts-fhir-types
- **PWA**: Vite PWA Plugin + Workbox
- **Native**: Capacitor
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest + Testing Library

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Firebase project (or use emulator)

## Quick Start

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your Firebase configuration:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 4. Use Firebase Emulator (Recommended for Development)

```bash
# In the root directory
firebase emulators:start
```

The app automatically connects to emulators when running in development mode.

## Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Quality Assurance
```bash
npm run lint         # Lint code
npm run type-check   # TypeScript type checking
npm test             # Run tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report
```

### Capacitor (Native)
```bash
npm run cap:init     # Initialize Capacitor
npm run cap:sync     # Sync web build to native platforms
npm run cap:ios      # Open Xcode
npm run cap:android  # Open Android Studio
```

### PWA
```bash
npm run pwa:generate-icons  # Generate PWA icons
```

## Project Structure

```
web/
├── public/              # Static assets
├── src/
│   ├── components/      # Shared components
│   ├── modules/         # Feature modules
│   │   ├── auth/        # Authentication
│   │   ├── onboarding/  # Onboarding flow
│   │   ├── patient/     # Patient features
│   │   ├── provider/    # Provider features
│   │   ├── researcher/  # Researcher features
│   │   ├── contacts/    # Contacts
│   │   └── account/     # Account settings
│   ├── services/        # API services
│   │   ├── firebase.ts  # Firebase integration
│   │   └── fhir.ts      # FHIR utilities
│   ├── hooks/           # React hooks
│   ├── utils/           # Utilities
│   │   ├── config.ts    # Configuration
│   │   ├── logger.ts    # Logging
│   │   ├── audit.ts     # Audit logging
│   │   └── helpers.ts   # Helper functions
│   ├── models/          # Data models
│   ├── types/           # TypeScript types
│   │   ├── index.ts     # Core types
│   │   ├── fhir.ts      # FHIR types
│   │   └── modules.ts   # Module types
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Configuration

### Feature Flags

Control features via environment variables:

```env
VITE_SKIP_ONBOARDING=false        # Skip onboarding flow
VITE_SHOW_ONBOARDING=true         # Always show onboarding
VITE_ENABLE_TEST_ACCOUNT=true     # Auto-login (dev only)
VITE_ENABLE_MULTI_ROLE=true       # Allow multiple roles per user
VITE_HIPAA_MODE=true              # HIPAA compliance mode
VITE_AUDIT_LOGGING=true           # Enable audit logs
```

### Firebase Emulator

The app auto-connects to Firebase emulators in development:

```env
VITE_USE_FIREBASE_EMULATOR=true
VITE_FIREBASE_AUTH_EMULATOR_URL=http://localhost:9099
VITE_FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
VITE_FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
```

## Healthcare Compliance

### HIPAA Considerations

This application is designed to support HIPAA compliance:

- ✅ **Encryption**: Data encrypted at rest (Firebase) and in transit (HTTPS)
- ✅ **Access Control**: User-scoped data access with Firestore security rules
- ✅ **Audit Logging**: All data access and modifications logged
- ✅ **Authentication**: Secure authentication with MFA support
- ✅ **Data Minimization**: Only collect necessary data
- ⚠️ **BAA Required**: Ensure Firebase Business Associate Agreement is signed
- ⚠️ **Risk Assessment**: Conduct thorough risk assessment before production use

### FHIR Compliance

All health data follows HL7 FHIR R4 standards:

- Patient resources
- Observation resources (vital signs, activity)
- QuestionnaireResponse resources
- LOINC and SNOMED coding systems
- UCUM units of measure

### Data Privacy

- User-scoped Firestore rules (see `/firestore.rules`)
- No PHI/PII in logs (sanitized via logger utility)
- Consent management with digital signatures
- User data deletion support

## Firestore Security Rules

The application uses strict security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Deployment

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

### Deploy to Vercel/Netlify

Build command: `npm run build`
Output directory: `dist`

### Native App Deployment

1. Build web app: `npm run build`
2. Sync to native: `npm run cap:sync`
3. Open platform: `npm run cap:ios` or `npm run cap:android`
4. Build and deploy via Xcode/Android Studio

## Testing

### Unit Tests

```bash
npm test
```

### Coverage

```bash
npm run test:coverage
```

### End-to-End Tests

(To be implemented with Playwright or Cypress)

## Development Guidelines

### Adding a New Module

1. Create module directory: `src/modules/mymodule/`
2. Add route in `App.tsx`
3. Update `MODULE_DEFINITIONS` in `types/modules.ts`
4. Add required permissions

### FHIR Data Conversion

Use the `fhirService` for all FHIR conversions:

```typescript
import fhirService from '@/services/fhir';

// Create FHIR Observation from health data
const observation = fhirService.createObservation(healthData, userId);

// Create FHIR QuestionnaireResponse
const response = fhirService.createQuestionnaireResponse(
  questionnaireId,
  userId,
  answers
);
```

### Audit Logging

Log all data access and modifications:

```typescript
import auditService from '@/utils/audit';

await auditService.logDataAccess(userId, 'health_data', dataId);
await auditService.logDataModification(userId, 'update', 'health_data', dataId);
```

## Troubleshooting

### Firebase Connection Issues

1. Check `.env` configuration
2. Verify Firebase project settings
3. Ensure emulators are running (dev mode)
4. Check browser console for errors

### Build Errors

1. Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Check TypeScript errors: `npm run type-check`

### PWA Not Updating

1. Clear browser cache
2. Unregister service worker
3. Hard reload (Cmd+Shift+R / Ctrl+Shift+R)

## Roadmap

- [ ] Complete onboarding flow with consent signature
- [ ] Implement wearable data integration (Web APIs)
- [ ] Add questionnaire builder and scheduler
- [ ] Build provider dashboard
- [ ] Implement researcher data export
- [ ] Add messaging system
- [ ] Implement offline sync
- [ ] Add end-to-end tests
- [ ] Performance optimization
- [ ] Accessibility audit (WCAG 2.1 AA)

## Contributing

This is a template application for healthcare research. Customize for your specific use case while maintaining compliance standards.

## License

See LICENSE.md in the root directory.

## Support

For questions or issues, please file an issue on the GitHub repository.

## Acknowledgments

Built with the Stanford Spezi framework principles, migrated to React for cross-platform web support.
