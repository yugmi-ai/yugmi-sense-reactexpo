# YugmiInspector React Native Mobile App Setup

This guide will help you set up and run the YugmiInspector mobile application built with React Native and Expo.

## Prerequisites

Before starting, make sure you have the following installed:

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Crossbuild UI CLI** (install globally):
   ```bash
   npm install -g cbui-cli
   ```
4. **Crossbuild UI CLI Login**:
   ```bash
   cbui-cli login
   ```
4. **Install UI Components**:
   ```bash
   cbui-cli install
   ```
3. **Expo CLI** (install globally):
   ```bash
   npm install -g @expo/cli
   ```
4. **Expo Go app** on your mobile device (download from App Store/Google Play)

## Project Structure

```
YugmiInspectorMobile/
├── src/
│   ├── screens/           # Main app screens
│   │   ├── DashboardScreen.tsx
│   │   ├── CameraScreen.tsx
│   │   ├── GalleryScreen.tsx
│   │   ├── ReportsScreen.tsx
│   │   └── MediaDetailScreen.tsx
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   └── lib/               # Utilities and API client
│       └── api.ts
├── assets/                # App icons and images
├── App.tsx               # Main app entry point
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript configuration
```

## Installation & Setup

### 1. Install Dependencies
```bash
cd YugmiInspectorMobile
npm install
```

### 2. Configure API Endpoint

Update the API base URL in `src/lib/api.ts`:

```typescript
// For development with backend running on your computer:
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:5000';

// Example:
const API_BASE_URL = 'http://192.168.1.100:5000';
```

**Important:** Replace `YOUR_COMPUTER_IP` with your actual computer's IP address. You can find this by:
- **Windows:** Run `ipconfig` in Command Prompt
- **macOS/Linux:** Run `ifconfig` in Terminal

### 3. Start the Backend Server

Make sure your YugmiInspector backend server is running:
```bash
cd ../  # Go back to main project directory
npm run dev
```

The server should be running on `http://localhost:5000`

### 4. Start the Mobile App

```bash
cd YugmiInspectorMobile
npm start
# or
npx expo start
```

## Running the App

### Option 1: Expo Go (Recommended for Development)

1. Open the Expo Go app on your mobile device
2. Scan the QR code displayed in your terminal
3. The app will load on your device

### Option 2: iOS Simulator (macOS only)

```bash
npm run ios
```

### Option 3: Android Emulator

```bash
npm run android
```

## App Features

### 🏠 Dashboard
- View inspection statistics (images, videos, issues)
- Quick action buttons for camera, gallery, and reports
- Recent activity with issue indicators
- Location-based status bar

### 📷 Camera
- Photo and video capture
- Real-time camera preview with grid overlay
- Flash control and camera switching
- GPS location tagging
- Automatic upload to backend with AI analysis

### 🖼️ Gallery
- Grid view of all captured media
- Filter by media type (photos/videos) or issues
- Issue badges with severity indicators
- Pull-to-refresh functionality

### 📊 Reports
- Create custom inspection reports
- Multiple report types (inspection, maintenance, safety, quality)
- Toggle options for including media, issues, and location data
- View existing reports with status indicators

### 🔍 Media Detail
- Full-screen media viewing
- Detailed AI analysis results
- Issue detection with confidence scores
- Location and metadata information

## Permissions Required

The app requires the following permissions:

- **Camera:** For capturing photos and videos
- **Microphone:** For recording videos with audio
- **Location:** For GPS tagging of media
- **Media Library:** For saving captured media to device

These permissions will be requested automatically when first using the relevant features.

## Configuration Options

### App Configuration (`app.json`)
```json
{
  "expo": {
    "name": "YugmiInspector",
    "slug": "yugmi-inspector",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#1D4ED8"
    }
  }
}
```

### API Configuration (`src/lib/api.ts`)

Update these settings based on your environment:

```typescript
// Development
const API_BASE_URL = 'http://192.168.1.100:5000';

// Production
const API_BASE_URL = 'https://your-production-api.com';
```

## Troubleshooting

### Common Issues

1. **"Network request failed" errors:**
   - Ensure backend server is running
   - Check that API_BASE_URL uses your computer's IP address, not localhost
   - Verify firewall settings aren't blocking the connection

2. **Camera permissions denied:**
   - Grant camera permissions in device settings
   - Restart the Expo Go app

3. **Images not loading in gallery:**
   - Check network connectivity
   - Verify API endpoint is accessible from mobile device

4. **App crashes on startup:**
   - Clear Expo cache: `npx expo start -c`
   - Restart Metro bundler

### Development Tips

1. **Enable debugging:**
   - Shake your device to open developer menu
   - Enable "Debug Remote JS" for better debugging

2. **Hot reloading:**
   - Changes to code will automatically refresh the app
   - If not working, enable "Hot Reloading" in developer menu

3. **Network debugging:**
   - Use React Native Debugger for network inspection
   - Check browser developer tools when debugging remotely

## Building for Production

### Create APK (Android)
```bash
expo build:android
```

### Create IPA (iOS)
```bash
expo build:ios
```

Note: You'll need Expo developer account for building production apps.

## Dependencies

Key dependencies used in this project:

- **React Native:** Core framework
- **Expo:** Development platform and tools
- **React Navigation:** Screen navigation
- **Expo Camera:** Camera functionality
- **Expo Location:** GPS services
- **React Query:** Data fetching and caching
- **React Native Paper:** UI components
- **NativeWind:** Styling system

## Contributing

When making changes to the mobile app:

1. Follow React Native/TypeScript best practices
2. Test on both iOS and Android when possible
3. Update this README if adding new features or changing setup process
4. Ensure the app works with the backend API

## Support

For issues or questions:
1. Check the backend server logs for API-related issues
2. Use React Native debugger for app-specific issues
3. Verify network connectivity between mobile device and backend server
