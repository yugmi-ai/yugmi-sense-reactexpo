# YugmiInspector React Native Firebase App

A complete field inspection mobile application built with React Native, Expo, and Firebase. This app provides comprehensive inspection capabilities with AI-powered analysis, real-time data synchronization, and offline support.

## 🏗️ Architecture Overview

### Firebase Services Used
- **Firebase Authentication**: User registration, login, and session management
- **Cloud Firestore**: Real-time database for all app data
- **Firebase Storage**: Media file storage and management
- **Firebase Functions**: Backend processing and AI integration (optional)

### App Structure
```
YugmiInspector/
├── src/
│   ├── screens/           # Main app screens
│   │   ├── DashboardScreen.tsx     # Overview and stats
│   │   ├── CameraScreen.tsx        # Photo/video capture
│   │   ├── GalleryScreen.tsx       # Media gallery
│   │   ├── ReportsScreen.tsx       # Inspection reports
│   │   ├── MediaDetailScreen.tsx   # Media details with AI analysis
│   │   ├── ProfileScreen.tsx       # User profile management
│   │   ├── LoginScreen.tsx         # User authentication
│   │   ├── SignupScreen.tsx        # User registration
│   │   └── ForgotPasswordScreen.tsx
│   ├── lib/              # Core services and utilities
│   │   ├── firebase.ts            # Firebase configuration
│   │   ├── firebaseService.ts     # Complete Firebase service layer
│   │   ├── authContext.tsx        # Authentication context
│   │   ├── api.ts                 # API client (Firebase proxy)
│   │   ├── mediaLibrary.ts        # Media library utilities
│   │   ├── aiService.ts           # AI analysis integration
│   │   └── offlineManager.ts      # Offline data management
│   └── types/            # TypeScript type definitions
├── assets/               # App icons and images
├── firestore.rules       # Firebase security rules
├── storage.rules         # Firebase Storage security rules
├── firestore.indexes.json # Database indexes
├── firebase.json         # Firebase project configuration
└── App.tsx              # Main app entry point
```

## 🚀 Setup Instructions

### Prerequisites
1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Expo CLI**: `npm install -g @expo/cli`
4. **Firebase CLI**: `npm install -g firebase-tools`
5. **Expo Go app** on your mobile device

### 1. Firebase Project Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create Project" and follow the setup wizard
3. Enable Google Analytics (recommended)

#### Enable Firebase Services
1. **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password" provider
   - Optionally enable other providers (Google, Apple, etc.)

2. **Firestore Database**:
   - Go to Firestore Database → Create database
   - Start in "Production mode" (we have security rules)
   - Choose your database location

3. **Storage**:
   - Go to Storage → Get started
   - Start in "Production mode"
   - Choose your storage location

#### Configure Web App
1. Go to Project Overview → Add app → Web app
2. Register your app with name "YugmiInspector"
3. Copy the Firebase configuration object
4. Update `src/lib/firebase.ts` with your configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 2. Deploy Firebase Rules and Indexes

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select the following services:
# ✓ Firestore: Configure security rules and indexes files
# ✓ Storage: Configure a security rules file for Firebase Storage

# Deploy rules and indexes
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

### 3. Install Dependencies

```bash
# Install project dependencies
npm install

# Install additional Firebase dependencies (if not already added)
npm install firebase firebase-functions
```

### 4. Configure Development Environment

#### Set up Environment Variables
Create a `.env` file in your project root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

#### Update Firebase Configuration (if using env variables)
Update `src/lib/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};
```

## 🏃‍♂️ Running the App

### Development Mode

```bash
# Start the Expo development server
npm start
# or
npx expo start
```

### Running on Devices

#### Option 1: Expo Go (Recommended for Development)
1. Install Expo Go on your mobile device
2. Scan the QR code from the terminal/browser
3. The app will load on your device

#### Option 2: iOS Simulator (macOS only)
```bash
npx expo run:ios
```

#### Option 3: Android Emulator
```bash
npx expo run:android
```

## 📱 App Features

### 🔐 Authentication
- Email/password registration and login
- Password reset functionality
- Secure session management with Firebase Auth
- User profile management

### 📷 Media Capture
- High-quality photo capture with camera controls
- Video recording with audio
- GPS location tagging
- Automatic upload to Firebase Storage
- Progress tracking for uploads

### 🤖 AI Analysis
- Automatic AI analysis of captured media
- Issue detection with severity levels
- Object recognition and labeling
- Confidence scoring for analysis results

### 🖼️ Gallery Management
- Grid view of all captured media
- Filter by media type (photos/videos)
- Filter by detected issues
- Pull-to-refresh functionality
- Detailed media view with analysis results

### 📊 Reporting
- Create custom inspection reports
- Multiple report types (inspection, maintenance, safety, quality)
- Include media, issues, and location data
- Report status tracking (draft, pending, completed)

### 📈 Dashboard & Statistics
- Real-time statistics (images, videos, issues)
- Recent activity overview
- Location-based status display
- Quick action buttons

### 🌐 Offline Support
- Offline media capture and storage
- Automatic sync when connection restored
- Cached data for offline viewing
- Retry mechanism for failed uploads

### 🔄 Real-time Updates
- Live data synchronization across devices
- Real-time stats updates
- Instant notification of new content

## 🛠️ Development Features

### TypeScript Support
- Full TypeScript implementation
- Comprehensive type definitions
- Enhanced IDE support and error checking

### State Management
- React Query for data fetching and caching
- Context API for authentication state
- Optimistic updates for better UX

### Performance Optimizations
- Image compression and optimization
- Lazy loading for large media lists
- Efficient pagination
- Database query optimization with indexes

### Security
- Firebase security rules for data protection
- User-based access control
- Secure file storage with user isolation
- Input validation and sanitization

## 📋 Testing

### Test User Creation
1. Use the signup screen to create test accounts
2. Test with different user roles
3. Verify data isolation between users

### Feature Testing Checklist
- [ ] User registration and login
- [ ] Camera photo capture
- [ ] Video recording
- [ ] GPS location tagging
- [ ] Media upload and analysis
- [ ] Gallery browsing and filtering
- [ ] Report creation and management
- [ ] Profile editing
- [ ] Offline functionality
- [ ] Real-time data sync

### Performance Testing
- [ ] Large media file uploads
- [ ] Multiple concurrent users
- [ ] Offline to online sync
- [ ] Memory usage optimization
- [ ] Battery usage optimization

## 🔧 Configuration Options

### Firebase Emulator (Development)
For local development, you can use Firebase emulators:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start emulators
firebase emulators:start

# Update firebase.ts to use emulators (uncomment emulator connections)
```

### AI Service Integration
Replace mock AI analysis in `src/lib/firebaseService.ts` with real AI services:
- Google Vision AI
- AWS Rekognition
- Azure Computer Vision
- Custom ML models

### Environment-Specific Configurations
- Development: Use Firebase emulators
- Staging: Separate Firebase project
- Production: Production Firebase project with analytics

## 🚨 Troubleshooting

### Common Issues

1. **Firebase Connection Errors**
   - Verify Firebase configuration
   - Check network connectivity
   - Ensure Firebase services are enabled

2. **Authentication Issues**
   - Verify Email/Password is enabled in Firebase Console
   - Check security rules
   - Clear app data and retry

3. **Media Upload Failures**
   - Check Storage security rules
   - Verify network connection
   - Check file size limits

4. **Permission Errors**
   - Grant camera permissions in device settings
   - Grant location permissions
   - Grant media library permissions

### Debug Mode
Enable detailed logging by setting debug mode in `src/lib/firebase.ts`:

```typescript
// Enable Firebase debug mode
if (__DEV__) {
  // Uncomment for detailed logging
  // firebase.firestore().settings({ ignoreUndefinedProperties: true });
}
```

## 🔄 Deployment

### Building for Production

#### Android APK
```bash
eas build --platform android --profile production
```

#### iOS IPA
```bash
eas build --platform ios --profile production
```

### Environment Configuration
Update Firebase configuration for production:
- Use production Firebase project
- Enable analytics and crash reporting
- Configure proper security rules
- Set up monitoring and alerts

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Query Documentation](https://tanstack.com/query/latest)

## 🤝 Contributing

1. Follow React Native and TypeScript best practices
2. Test on both iOS and Android
3. Update documentation for new features
4. Ensure Firebase security rules are updated for new data structures
5. Test offline functionality for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues or questions:
1. Check Firebase console for service status
2. Review Expo development tools for app-specific issues
3. Check device permissions and network connectivity
4. Review Firebase security rules for data access issues

---

## 🎯 Success Criteria

The app is working correctly when you can:
✅ Register and login users
✅ Capture and upload photos/videos with GPS data
✅ View media in gallery with AI analysis results
✅ Create and manage inspection reports
✅ Access real-time dashboard statistics
✅ Work offline and sync when connection restored
✅ Navigate smoothly between all screens

Your YugmiInspector Firebase app is ready for comprehensive field inspections! 🎉
