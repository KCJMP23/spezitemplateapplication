# INTELLIC Health - Quick Start Guide

## 🚀 Start Testing in 5 Minutes

### Option 1: Test Without Real Devices (Fastest)

```bash
cd web

# 1. Update .env to use offline mode
echo "VITE_DISABLE_FIREBASE=true" >> .env

# 2. Start the development server
npm run dev

# 3. Open in browser
# Navigate to: http://localhost:5173

# 4. Log in as test user
# The app will use mock data for demonstration
```

**What You Can Do:**
- ✅ Explore the full UI
- ✅ See mock health data visualizations
- ✅ Test the module configuration wizard at `/setup/modules`
- ✅ View device integration UI at `/data-sources`
- ❌ Real device data streaming (requires setup below)

---

### Option 2: Full Setup with Real Data Streaming

#### Prerequisites
```bash
# Check you have Node.js 18+
node --version

# Check you have npm 9+
npm --version
```

#### Step 1: Firebase Setup (Required for data persistence)

1. **Create Firebase Project**
   ```
   Go to: https://console.firebase.google.com
   Click: "Create a project"
   Name: "intellic-health"
   Enable: Google Analytics (optional)
   ```

2. **Enable Services**
   ```
   Authentication → Get Started → Enable "Email/Password"
   Firestore Database → Create database → Start in test mode
   Storage → Get Started → Start in test mode
   ```

3. **Get Configuration**
   ```
   Project Settings → General → Your apps → Web app
   Copy the firebaseConfig object
   ```

4. **Update `.env` file**
   ```bash
   cd web
   nano .env
   ```

   Update these values:
   ```env
   VITE_FIREBASE_API_KEY=your-actual-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id

   # Disable emulator mode for production Firebase
   VITE_USE_FIREBASE_EMULATOR=false
   VITE_DISABLE_FIREBASE=false
   ```

5. **Test Firebase Connection**
   ```bash
   npm run dev
   # Navigate to http://localhost:5173
   # Sign up with email/password
   # Check Firebase Console → Authentication for your user
   ```

---

#### Step 2: Apple Health / Apple Watch Integration

**Requirements:**
- iOS device (iPhone or iPad)
- Mac computer (for iOS simulator)
- Xcode 15+

**Setup:**

1. **On Mac: Generate iOS Project**
   ```bash
   cd web
   npx cap add ios
   npx cap sync
   ```

2. **Open in Xcode**
   ```bash
   npx cap open ios
   ```

3. **Configure HealthKit Capability**
   - In Xcode, select your app target
   - Go to "Signing & Capabilities"
   - Click "+ Capability"
   - Add "HealthKit"
   - Enable "Clinical Health Records" (optional)

4. **Update Info.plist**
   - Open `ios/App/App/Info.plist`
   - Add these keys:
   ```xml
   <key>NSHealthShareUsageDescription</key>
   <string>INTELLIC Health needs access to read your health data to provide personalized insights and track your wellness goals.</string>

   <key>NSHealthUpdateUsageDescription</key>
   <string>INTELLIC Health needs permission to save health data to your Health app.</string>
   ```

5. **Build and Run**
   - Connect your iPhone or select iOS Simulator
   - Click the Play button in Xcode
   - On device: Grant HealthKit permissions when prompted

6. **In the App:**
   - Navigate to `/data-sources`
   - Click "Connect" for Apple Health
   - Grant permissions for desired data types
   - Click "Sync Now" to pull data

**What Gets Synced:**
- ❤️ Heart rate (from Apple Watch)
- 🩺 Blood pressure
- 👟 Steps and distance
- 🔥 Active energy (calories)
- 🫁 Blood oxygen (SpO2)
- ⚖️ Weight

---

#### Step 3: Withings Devices Integration

**Requirements:**
- Withings account
- Withings device (Body+, BPM Connect, etc.)

**Setup:**

1. **Register Withings Developer Account**
   ```
   Go to: https://developer.withings.com/
   Create account
   Create new app:
     - Name: INTELLIC Health
     - Description: Health data tracking platform
     - Callback URI: http://localhost:5173/withings/callback
     - Permissions: user.metrics
   ```

2. **Get Credentials**
   - After app creation, note:
     - Client ID
     - Client Secret

3. **Update `.env`**
   ```env
   VITE_WITHINGS_CLIENT_ID=your-client-id
   VITE_WITHINGS_CLIENT_SECRET=your-client-secret
   VITE_WITHINGS_REDIRECT_URI=http://localhost:5173/withings/callback
   ```

4. **Create Callback Handler**
   The callback route is already set up. When you click "Connect" in the app:
   - Browser opens Withings authorization page
   - You log in with Withings account
   - Authorize the app
   - Browser redirects to `/withings/callback`
   - App exchanges code for access token

5. **In the App:**
   - Navigate to `/data-sources`
   - Click "Connect" for Withings
   - Log in to your Withings account
   - Authorize INTELLIC Health
   - Click "Sync Now" to pull data

**What Gets Synced:**
- ⚖️ Weight (from Body+ scale)
- 🩸 Blood pressure (from BPM Connect)
- ❤️ Heart rate
- 🌡️ Body temperature
- 📊 Body composition (fat %, muscle mass, etc.)

---

#### Step 4: Epic MyChart Integration

**Requirements:**
- Healthcare provider using Epic EHR
- Epic MyChart account
- Epic developer credentials (for production)

**Development/Testing:**

For development, you can use Epic's sandbox environment:

1. **Register with Epic**
   ```
   Go to: https://fhir.epic.com/
   Create developer account
   Register your app:
     - Name: INTELLIC Health
     - Redirect URI: http://localhost:5173/epic/callback
     - FHIR Version: R4
     - App Type: Patient-facing
   ```

2. **Get Client ID**
   - After registration, Epic provides a Client ID
   - Note: Public client (no client secret)

3. **Update `.env`**
   ```env
   VITE_EPIC_CLIENT_ID=your-client-id
   VITE_EPIC_REDIRECT_URI=http://localhost:5173/epic/callback
   ```

4. **Test with Sandbox**
   Epic provides test credentials:
   ```
   Username: fhircamila (or other test patients)
   Password: epicepic1
   ```

5. **In the App:**
   - Navigate to `/data-sources`
   - Click "Connect" for Epic MyChart
   - Log in with test credentials
   - Authorize access to health records
   - Click "Sync Now" to pull data

**What Gets Synced:**
- 🏥 Patient demographics
- 🩺 Vital signs (latest values)
- 🧪 Lab results
- 💊 Medications
- 🩹 Diagnoses/conditions
- 💉 Immunizations
- 📄 Clinical documents

**Production:**
- Apply for Epic App Orchard
- Complete security review
- Sign BAA for HIPAA compliance
- Get production FHIR endpoint access

---

## 📱 Mobile Testing

### Android

```bash
cd web

# 1. Build the app
npm run build

# 2. Sync to Android
npx cap sync

# 3. Open in Android Studio
npx cap open android

# 4. Run on emulator or device
# Click the green play button in Android Studio
```

**Android Emulator Requirements:**
- Android Studio installed
- Android SDK 33+
- Google Play Services (for location, etc.)

### iOS

```bash
cd web

# 1. Build the app (on Mac only)
npm run build

# 2. Add iOS platform (on Mac only)
npx cap add ios

# 3. Sync to iOS
npx cap sync

# 4. Open in Xcode
npx cap open ios

# 5. Select device/simulator and run
# Click the play button in Xcode
```

**iOS Simulator Requirements:**
- macOS
- Xcode 15+
- iOS Simulator

---

## 🔧 Troubleshooting

### "Firebase not configured" error
```bash
# Check .env file has real Firebase credentials
cat .env | grep FIREBASE

# Or disable Firebase for testing
echo "VITE_DISABLE_FIREBASE=true" >> .env
```

### "HealthKit not available" error
- HealthKit only works on iOS devices
- Not available in web browser
- iOS Simulator has limited HealthKit support

### "Withings connection failed" error
- Check client ID and secret are correct
- Ensure redirect URI matches exactly
- Verify Withings account is active

### "Epic authorization failed" error
- Check client ID is correct
- Use Epic sandbox credentials for testing
- Production requires Epic App Orchard approval

### Build errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist .vite
npm install
npm run build
```

---

## 📊 Viewing Your Data

### Health Data Dashboard
```
Navigate to: /health-data
```

**Features:**
- 📈 Interactive charts for all metrics
- 📅 Date range filtering
- 📥 Export to CSV/PDF
- 🔄 Real-time updates
- 📱 Responsive design

### Data Sources Management
```
Navigate to: /data-sources
```

**Features:**
- ✅ Connect/disconnect devices
- 🔄 Manual sync triggers
- ⏰ Auto-sync configuration
- 📊 Sync status monitoring
- ❌ Error reporting

---

## 🎯 Next Steps

1. **Customize the App**
   - Update branding colors in `src/App.tsx`
   - Add your logo to `public/`
   - Modify privacy policy and terms

2. **Production Deployment**
   - Deploy to Netlify, Vercel, or Firebase Hosting
   - Update redirect URIs for production domain
   - Enable Firebase BAA for HIPAA compliance
   - Get production API credentials for Withings/Epic

3. **Add More Features**
   - Custom health insights with AI
   - Medication reminders
   - Provider communication
   - Care team collaboration

---

## 🆘 Getting Help

- **Documentation**: See `DEPLOYMENT_GUIDE.md`
- **Module Configuration**: Visit `/setup/modules`
- **API Docs**: Check service files in `src/services/`
- **Issues**: Check browser console for errors

---

## ✅ Quick Test Checklist

- [ ] App loads without errors
- [ ] Can sign up/login
- [ ] Can navigate to `/data-sources`
- [ ] Firebase connection works
- [ ] Can manually add health data
- [ ] Charts display correctly
- [ ] Can connect Apple Health (iOS only)
- [ ] Can connect Withings (with credentials)
- [ ] Can connect Epic MyChart (with credentials)
- [ ] Data syncs successfully
- [ ] Auto-sync works in background

---

**You're all set!** 🎉

Your INTELLIC Health app is now ready to stream real health data from multiple sources.
