# YugmiInspector Mobile App Testing Guide

## 🔧 Fixed Issues

### ✅ **Camera Implementation Fixed**
- Updated to use `expo-camera` latest API
- Fixed `Cannot read property 'back' of undefined` error
- Implemented proper permission handling
- Added fallback for media library limitations in Expo Go

### ✅ **Media Library Compatibility**
- Created utility for handling media library access
- Graceful fallback when Expo Go limitations prevent saving to gallery
- Photos/videos still upload to server for AI analysis

### ✅ **Geolocation Integration**
- Proper location permissions handling
- GPS coordinates captured and sent with media
- Reverse geocoding for human-readable addresses

## 🚀 How to Test

### **Backend Server Status**
✅ **Running on**: `http://localhost:5000`
✅ **Database**: SQLite configured and ready
✅ **API Endpoints**: All functional

### **Mobile App Status**
✅ **Expo Development Server**: Running
✅ **Dependencies**: Installed with compatibility fixes
✅ **Permissions**: Camera, location, and media library configured

## 📱 **Testing Steps**

### **1. On Expo Go (Recommended for Quick Testing)**
1. Download **Expo Go** app on your phone
2. Make sure phone is on same WiFi as computer
3. Open Expo Go and scan QR code from terminal/browser
4. Test basic navigation and UI

**Limitations in Expo Go:**
- ⚠️ Media library saves may not work (photos won't save to device gallery)
- ✅ Camera functionality works
- ✅ Location services work
- ✅ Upload to server works
- ✅ AI analysis works

### **2. On Android Emulator (Full Testing)**
```bash
npx expo run:android
```

### **3. On iOS Simulator (Full Testing - macOS only)**
```bash
npx expo run:ios
```

## 🧪 **Test Scenarios**

### **📷 Camera Testing**
1. **Photo Capture:**
   - Open app → Navigate to Camera
   - Grant camera permissions
   - Take a photo
   - Verify it uploads to server
   - Check if location is tagged

2. **Video Recording:**
   - Switch to video mode
   - Record a short video (10-15 seconds)
   - Verify upload and processing

### **📍 Location Testing**
1. **GPS Tagging:**
   - Ensure location permissions granted
   - Take photo/video
   - Check if coordinates are captured
   - Verify address reverse geocoding

### **🤖 AI Analysis Testing**
1. **Upload & Analysis:**
   - Capture media of construction/building elements
   - Verify upload to backend
   - Check AI analysis results in gallery
   - Look for detected issues/objects

### **📊 Dashboard Testing**
1. **Stats Display:**
   - Check if image/video counts update
   - Verify issue detection counts
   - Test quick action buttons

### **📁 Gallery Testing**
1. **Media Grid:**
   - View uploaded media
   - Test filtering (All/Photos/Videos/Issues)
   - Check issue badges and severity indicators

## 🔧 **Configuration Notes**

### **API Endpoint Configuration**
Current setting: `http://10.0.2.2:5000` (Android emulator localhost mapping)

**For different testing scenarios:**
- **Android Emulator**: `http://10.0.2.2:5000` ✅
- **iOS Simulator**: `http://localhost:5000`
- **Physical Device**: `http://192.168.189.249:5000` (your computer's IP)

To change API endpoint, update `YugmiInspectorMobile/src/lib/api.ts`:
```typescript
const API_BASE_URL = 'http://YOUR_IP_HERE:5000';
```

## 🚨 **Known Limitations & Solutions**

### **Expo Go Limitations**
**Issue**: Media library access limited in Expo Go
**Solution**: 
- Photos/videos still upload to server ✅
- AI analysis still works ✅
- For full media library access, create development build

### **Development Build (For Full Features)**
If you need full media library access:
```bash
# Install development build tools
npx expo install expo-dev-client

# Create development build
eas build --profile development --platform android
```

## 📋 **Testing Checklist**

### **Core Functionality**
- [ ] App launches without errors
- [ ] Camera permissions granted successfully
- [ ] Location permissions granted successfully
- [ ] Photo capture works
- [ ] Video recording works
- [ ] Media uploads to server
- [ ] GPS coordinates captured
- [ ] Address reverse geocoding works
- [ ] AI analysis processes media
- [ ] Gallery displays uploaded media
- [ ] Dashboard shows statistics
- [ ] Reports can be created

### **Error Handling**
- [ ] Graceful handling of permission denials
- [ ] Network error handling
- [ ] Camera access failures handled
- [ ] Location unavailable scenarios
- [ ] Upload failure feedback

## 🛠️ **Troubleshooting**

### **App Won't Load**
1. Check if Expo development server is running
2. Ensure phone and computer on same network
3. Try clearing Expo cache: `npx expo start --clear`

### **Camera Not Working**
1. Verify camera permissions granted
2. Try closing and reopening camera screen
3. Check device camera works in other apps

### **Location Not Working**
1. Enable location services on device
2. Grant location permissions to Expo Go
3. Test outdoors for better GPS signal

### **Upload Failures**
1. Check backend server is running on port 5000
2. Verify network connectivity
3. Update API endpoint if testing on physical device

## 📞 **Getting Help**

If you encounter issues:
1. Check terminal/console for error messages
2. Look at React Native debugger for detailed errors
3. Verify backend server logs for API issues
4. Test API endpoints directly with curl/Postman

## 🎯 **Success Criteria**

The app is working correctly if you can:
✅ Take photos and videos
✅ See GPS coordinates in uploads
✅ View uploaded media in gallery
✅ See AI analysis results
✅ Create and view reports
✅ Navigate between all screens smoothly

Your YugmiInspector mobile app is now ready for comprehensive testing! 🎉
