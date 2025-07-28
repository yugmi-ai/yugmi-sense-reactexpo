// Complete Firebase Service for YugmiInspector
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  Timestamp,
  serverTimestamp,
  setDoc,
  increment,
  writeBatch,
  onSnapshot,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
  getMetadata
} from 'firebase/storage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import * as Location from 'expo-location';
import { db, storage, auth, collections, storagePaths } from './firebase';
import {
  MediaUploadData,
  MediaListResponse,
  Stats,
  ReportsListResponse,
  MediaWithAnalysis,
  Report,
  AuthCredentials,
  SignupData,
  AuthResponse,
  AiAnalysis,
  User,
  LocationData
} from '../types';

class FirebaseService {
  // Health check and connection status
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      const testRef = doc(db, collections.stats, 'health');
      await getDoc(testRef);
      return { status: 'ok', message: 'Firebase connection successful' };
    } catch (error) {
      console.error('Firebase health check failed:', error);
      throw new Error('Firebase connection failed');
    }
  }

  // Authentication Services
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      
      // Get additional user data from Firestore
      const userRef = doc(db, collections.users, firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      const user: User = {
        id: parseInt(firebaseUser.uid.slice(-8), 16) || Date.now(),
        username: userData.username || firebaseUser.email?.split('@')[0] || '',
        email: firebaseUser.email || '',
        fullName: userData.fullName || '',
        role: userData.role || 'user',
        createdAt: userData.createdAt || new Date().toISOString()
      };
      
      return { user, token };
    } catch (error: any) {
      console.error('Login error:', error);
      this.handleFirebaseError(error);
      throw error;
    }
  }

  async signup(userData: SignupData): Promise<AuthResponse> {
    try {
      if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      const firebaseUser = userCredential.user;
      
      // Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: userData.fullName
      });
      
      // Save additional user data to Firestore
      const userDocData = {
        username: userData.email.split('@')[0],
        email: userData.email,
        fullName: userData.fullName,
        role: 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        profilePicture: null,
        settings: {
          notifications: true,
          offlineMode: false,
          autoSync: true
        }
      };
      
      const userRef = doc(db, collections.users, firebaseUser.uid);
      await setDoc(userRef, userDocData);
      
      const token = await firebaseUser.getIdToken();
      
      const user: User = {
        id: parseInt(firebaseUser.uid.slice(-8), 16) || Date.now(),
        username: userDocData.username,
        email: userDocData.email,
        fullName: userDocData.fullName,
        role: userDocData.role,
        createdAt: new Date().toISOString()
      };
      
      return { user, token };
    } catch (error: any) {
      console.error('Signup error:', error);
      this.handleFirebaseError(error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { message: 'Password reset email sent successfully' };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      this.handleFirebaseError(error);
      throw error;
    }
  }

  // Media Management Services
  async uploadMedia(data: MediaUploadData): Promise<MediaWithAnalysis> {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      console.log('Starting upload for user:', auth.currentUser.uid);
      console.log('File data:', { 
        uri: (data.file as any).uri, 
        type: (data.file as any).type, 
        name: (data.file as any).name 
      });

      // Get location data if not provided
      let locationData: LocationData | null = null;
      if (data.latitude && data.longitude) {
        locationData = {
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.locationAddress,
          locationName: data.locationName
        };
      } else {
        locationData = await this.getCurrentLocation();
      }

      // Handle React Native file object
      const fileUri = (data.file as any).uri;
      if (!fileUri) {
        throw new Error('File URI is missing');
      }

      // Determine file extension from MIME type or URI
      const mimeType = (data.file as any).type || 'image/jpeg';
      const extension = mimeType.includes('video') ? '.mp4' : '.jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}${extension}`;
      const filePath = `${storagePaths.media}/${auth.currentUser.uid}/${fileName}`;
      
      console.log('Upload path:', filePath);
      console.log('MIME type:', mimeType);
      
      const storageRef = ref(storage, filePath);
      
      // Create blob from file with better error handling
      let blob: Blob;
      try {
        const response = await fetch(fileUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        blob = await response.blob();
        console.log('Blob created, size:', blob.size, 'type:', blob.type);
        
        if (blob.size === 0) {
          throw new Error('File is empty or could not be read');
        }
      } catch (fetchError) {
        console.error('Error creating blob:', fetchError);
        throw new Error(`Failed to process file: ${fetchError}`);
      }
      
      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, blob, {
        contentType: mimeType
      });
      
      // Wait for upload completion with detailed error handling
      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload progress:', progress.toFixed(2) + '%');
            console.log('Bytes transferred:', snapshot.bytesTransferred, 'of', snapshot.totalBytes);
          },
          (error) => {
            console.error('Upload error details:', {
              code: error.code,
              message: error.message,
              name: error.name,
              serverResponse: error.serverResponse
            });
            reject(error);
          },
          () => {
            console.log('Upload completed successfully');
            resolve(uploadTask.snapshot);
          }
        );
      });
      
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      // Generate AI analysis (mock for now)
      const analysisData: AiAnalysis = await this.generateAIAnalysis(downloadURL, (data.file as any).type);
      
      // Create media document in Firestore
      const mediaData = {
        filename: fileName,
        originalName: (data.file as any).name || fileName,
        mimeType: (data.file as any).type || 'image/jpeg',
        size: blob.size,
        type: (data.file as any).type?.startsWith('video') ? 'video' : 'image' as 'image' | 'video',
        downloadURL,
        filePath,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...locationData,
        analysis: analysisData,
        metadata: {
          device: 'mobile',
          platform: 'expo',
          version: '1.0.0'
        }
      };
      
      const mediaRef = collection(db, collections.media);
      const mediaDoc = await addDoc(mediaRef, mediaData);
      
      // Update user and global stats
      await this.updateStats(mediaData.type, analysisData.detectedIssues?.length || 0);
      
      // Return the media item with analysis
      return {
        id: parseInt(mediaDoc.id.slice(-8), 16) || Date.now(),
        filename: fileName,
        originalName: mediaData.originalName,
        mimeType: mediaData.mimeType,
        size: blob.size,
        type: mediaData.type,
        latitude: locationData?.latitude,
        longitude: locationData?.longitude,
        locationName: locationData?.locationName,
        locationAddress: locationData?.address,
        createdAt: new Date().toISOString(),
        analysis: analysisData
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  async getMedia(page = 1, pageLimit = 20, filter?: string): Promise<MediaListResponse> {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      let mediaQuery = query(
        collection(db, collections.media),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc'),
        firestoreLimit(pageLimit * page)
      );

      // Apply filters
      if (filter === 'photos') {
        mediaQuery = query(
          collection(db, collections.media),
          where('userId', '==', auth.currentUser.uid),
          where('type', '==', 'image'),
          orderBy('createdAt', 'desc'),
          firestoreLimit(pageLimit * page)
        );
      } else if (filter === 'videos') {
        mediaQuery = query(
          collection(db, collections.media),
          where('userId', '==', auth.currentUser.uid),
          where('type', '==', 'video'),
          orderBy('createdAt', 'desc'),
          firestoreLimit(pageLimit * page)
        );
      }

      const mediaSnapshot = await getDocs(mediaQuery);
      const allMediaItems: MediaWithAnalysis[] = [];
      
      mediaSnapshot.forEach((docSnapshot) => {
        const mediaData = docSnapshot.data();
        const mediaItem: MediaWithAnalysis = {
          id: parseInt(docSnapshot.id.slice(-8), 16) || Date.now(),
          filename: mediaData.filename || '',
          originalName: mediaData.originalName || '',
          mimeType: mediaData.mimeType || '',
          size: mediaData.size || 0,
          type: mediaData.type || 'image',
          latitude: mediaData.latitude,
          longitude: mediaData.longitude,
          locationName: mediaData.locationName,
          locationAddress: mediaData.locationAddress,
          createdAt: mediaData.createdAt instanceof Timestamp 
            ? mediaData.createdAt.toDate().toISOString() 
            : mediaData.createdAt || new Date().toISOString(),
          analysis: mediaData.analysis
        };
        allMediaItems.push(mediaItem);
      });
      
      // Implement pagination
      const startIndex = (page - 1) * pageLimit;
      const endIndex = startIndex + pageLimit;
      const mediaItems = allMediaItems.slice(startIndex, endIndex);
      
      return {
        mediaItems,
        pagination: {
          page,
          limit: pageLimit,
          total: allMediaItems.length,
          totalPages: Math.ceil(allMediaItems.length / pageLimit)
        }
      };
    } catch (error) {
      console.error('Error getting media:', error);
      throw error;
    }
  }

  async getMediaItem(id: number): Promise<MediaWithAnalysis | null> {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Find media by user and timestamp-based ID
      const mediaQuery = query(
        collection(db, collections.media),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const mediaSnapshot = await getDocs(mediaQuery);
      let foundMedia: MediaWithAnalysis | null = null;
      
      mediaSnapshot.forEach((docSnapshot) => {
        const mediaData = docSnapshot.data();
        const mediaId = parseInt(docSnapshot.id.slice(-8), 16) || Date.now();
        
        if (mediaId === id) {
          foundMedia = {
            id: mediaId,
            filename: mediaData.filename || '',
            originalName: mediaData.originalName || '',
            mimeType: mediaData.mimeType || '',
            size: mediaData.size || 0,
            type: mediaData.type || 'image',
            latitude: mediaData.latitude,
            longitude: mediaData.longitude,
            locationName: mediaData.locationName,
            locationAddress: mediaData.locationAddress,
            createdAt: mediaData.createdAt instanceof Timestamp 
              ? mediaData.createdAt.toDate().toISOString() 
              : mediaData.createdAt || new Date().toISOString(),
            analysis: mediaData.analysis
          };
        }
      });
      
      return foundMedia;
    } catch (error) {
      console.error(`Error getting media item with ID ${id}:`, error);
      throw error;
    }
  }

  async deleteMedia(id: number): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Find and delete the media document
      const mediaQuery = query(
        collection(db, collections.media),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const mediaSnapshot = await getDocs(mediaQuery);
      
      for (const docSnapshot of mediaSnapshot.docs) {
        const mediaId = parseInt(docSnapshot.id.slice(-8), 16) || Date.now();
        
        if (mediaId === id) {
          const mediaData = docSnapshot.data();
          
          // Delete from Storage
          if (mediaData.filePath) {
            const fileRef = ref(storage, mediaData.filePath);
            await deleteObject(fileRef);
          }
          
          // Delete from Firestore
          await deleteDoc(docSnapshot.ref);
          break;
        }
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  }

  // Reports Management Services
  async createReport(reportData: Partial<Report>): Promise<Report> {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const reportDocument = {
        ...reportData,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: reportData.status || 'draft'
      };
      
      const reportRef = collection(db, collections.reports);
      const reportDoc = await addDoc(reportRef, reportDocument);
      
      return {
        id: parseInt(reportDoc.id.slice(-8), 16) || Date.now(),
        title: reportData.title || '',
        type: reportData.type || '',
        status: reportData.status || 'draft',
        startDate: reportData.startDate,
        endDate: reportData.endDate,
        includeImages: reportData.includeImages,
        includeIssues: reportData.includeIssues,
        includeLocation: reportData.includeLocation,
        content: reportData.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  async getReports(page = 1, pageLimit = 10): Promise<ReportsListResponse> {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const reportsQuery = query(
        collection(db, collections.reports),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc'),
        firestoreLimit(pageLimit * page)
      );
      
      const reportsSnapshot = await getDocs(reportsQuery);
      const allReports: Report[] = [];
      
      reportsSnapshot.forEach((docSnapshot) => {
        const reportData = docSnapshot.data();
        const report: Report = {
          id: parseInt(docSnapshot.id.slice(-8), 16) || Date.now(),
          title: reportData.title || '',
          type: reportData.type || '',
          status: reportData.status || 'draft',
          startDate: reportData.startDate,
          endDate: reportData.endDate,
          includeImages: reportData.includeImages,
          includeIssues: reportData.includeIssues,
          includeLocation: reportData.includeLocation,
          content: reportData.content,
          createdAt: reportData.createdAt instanceof Timestamp 
            ? reportData.createdAt.toDate().toISOString() 
            : reportData.createdAt || new Date().toISOString(),
          updatedAt: reportData.updatedAt instanceof Timestamp 
            ? reportData.updatedAt.toDate().toISOString() 
            : reportData.updatedAt || new Date().toISOString()
        };
        allReports.push(report);
      });
      
      const startIndex = (page - 1) * pageLimit;
      const endIndex = startIndex + pageLimit;
      const reports = allReports.slice(startIndex, endIndex);
      
      return {
        reports,
        pagination: {
          page,
          limit: pageLimit,
          total: allReports.length,
          totalPages: Math.ceil(allReports.length / pageLimit)
        }
      };
    } catch (error) {
      console.error('Error getting reports:', error);
      throw error;
    }
  }

  async getReport(id: number): Promise<Report | null> {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const reportsQuery = query(
        collection(db, collections.reports),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const reportsSnapshot = await getDocs(reportsQuery);
      let foundReport: Report | null = null;
      
      reportsSnapshot.forEach((docSnapshot) => {
        const reportId = parseInt(docSnapshot.id.slice(-8), 16) || Date.now();
        
        if (reportId === id) {
          const reportData = docSnapshot.data();
          foundReport = {
            id: reportId,
            title: reportData.title || '',
            type: reportData.type || '',
            status: reportData.status || 'draft',
            startDate: reportData.startDate,
            endDate: reportData.endDate,
            includeImages: reportData.includeImages,
            includeIssues: reportData.includeIssues,
            includeLocation: reportData.includeLocation,
            content: reportData.content,
            createdAt: reportData.createdAt instanceof Timestamp 
              ? reportData.createdAt.toDate().toISOString() 
              : reportData.createdAt || new Date().toISOString(),
            updatedAt: reportData.updatedAt instanceof Timestamp 
              ? reportData.updatedAt.toDate().toISOString() 
              : reportData.updatedAt || new Date().toISOString()
          };
        }
      });
      
      return foundReport;
    } catch (error) {
      console.error(`Error getting report with ID ${id}:`, error);
      throw error;
    }
  }

  // Stats Services
  async getStats(): Promise<Stats> {
    try {
      if (!auth.currentUser) {
        return { imagesCount: 0, videosCount: 0, issuesCount: 0 };
      }

      // Get user-specific stats
      const userStatsRef = doc(db, collections.stats, auth.currentUser.uid);
      const userStatsDoc = await getDoc(userStatsRef);
      
      if (userStatsDoc.exists()) {
        const data = userStatsDoc.data();
        return {
          imagesCount: data.imagesCount || 0,
          videosCount: data.videosCount || 0,
          issuesCount: data.issuesCount || 0
        };
      }
      
      // If no stats exist, calculate from media collection
      const mediaQuery = query(
        collection(db, collections.media),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const mediaSnapshot = await getDocs(mediaQuery);
      let imagesCount = 0;
      let videosCount = 0;
      let issuesCount = 0;
      
      mediaSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type === 'image') imagesCount++;
        if (data.type === 'video') videosCount++;
        if (data.analysis?.detectedIssues?.length > 0) {
          issuesCount += data.analysis.detectedIssues.length;
        }
      });
      
      const stats = { imagesCount, videosCount, issuesCount };
      
      // Save calculated stats
      await setDoc(userStatsRef, stats);
      
      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      return { imagesCount: 0, videosCount: 0, issuesCount: 0 };
    }
  }

  // Utility Services
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      
      // Reverse geocode to get address
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const { street, city, region, country } = reverseGeocode[0];
          const address = `${street || ''} ${city || ''} ${region || ''} ${country || ''}`.trim();
          
          return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            address: address || 'Unknown location',
            locationName: city || region || 'Unknown'
          };
        }
      } catch (geocodeError) {
        console.warn('Geocoding failed:', geocodeError);
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: 'Location found',
        locationName: 'Unknown'
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  getMediaFileUrl(id: number, type: 'original' | 'thumbnail' = 'original'): string {
    // This is a placeholder - in real implementation, you'd fetch the download URL from Firestore
    return `https://firebasestorage.googleapis.com/v0/b/yugmi-app-e14c0.appspot.com/o/media%2F${id}.jpg?alt=media`;
  }

  // Private helper methods
  private async generateAIAnalysis(imageUrl: string, mimeType: string): Promise<AiAnalysis> {
    // Mock AI analysis - replace with real AI service integration
    const mockIssues = [
      { type: 'structural', severity: 'low' as const, description: 'Minor surface wear detected', confidence: 0.75 },
      { type: 'maintenance', severity: 'medium' as const, description: 'Routine maintenance recommended', confidence: 0.85 }
    ];

    return {
      id: Date.now(),
      mediaItemId: Date.now(),
      analysisText: 'AI analysis completed. No critical issues detected.',
      detectedObjects: ['wall', 'surface', 'structure'],
      detectedIssues: Math.random() > 0.7 ? mockIssues : [],
      confidence: 0.85,
      createdAt: new Date().toISOString()
    };
  }

  private async updateStats(mediaType: 'image' | 'video', issuesCount: number): Promise<void> {
    if (!auth.currentUser) return;

    try {
      const userStatsRef = doc(db, collections.stats, auth.currentUser.uid);
      const batch = writeBatch(db);

      // Update user stats
      batch.set(userStatsRef, {
        imagesCount: increment(mediaType === 'image' ? 1 : 0),
        videosCount: increment(mediaType === 'video' ? 1 : 0),
        issuesCount: increment(issuesCount),
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // Update global stats
      const globalStatsRef = doc(db, collections.stats, 'global');
      batch.set(globalStatsRef, {
        totalImages: increment(mediaType === 'image' ? 1 : 0),
        totalVideos: increment(mediaType === 'video' ? 1 : 0),
        totalIssues: increment(issuesCount),
        totalUsers: increment(0), // Don't increment users here
        lastUpdated: serverTimestamp()
      }, { merge: true });

      await batch.commit();
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  private handleFirebaseError(error: any): void {
    // Enhanced error handling
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Invalid password',
      'auth/email-already-in-use': 'Email is already in use',
      'auth/weak-password': 'Password is too weak',
      'auth/invalid-email': 'Invalid email address',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'storage/unauthorized': 'Upload failed. Please check permissions',
      'storage/canceled': 'Upload was canceled',
      'storage/unknown': 'Upload failed. Please try again'
    };

    const friendlyMessage = errorMessages[error.code] || error.message || 'An unexpected error occurred';
    error.message = friendlyMessage;
  }

  // Real-time listeners
  subscribeToMediaUpdates(callback: (media: MediaWithAnalysis[]) => void): () => void {
    if (!auth.currentUser) {
      return () => {};
    }

    const mediaQuery = query(
      collection(db, collections.media),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(mediaQuery, (snapshot) => {
      const mediaItems: MediaWithAnalysis[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        mediaItems.push({
          id: parseInt(doc.id.slice(-8), 16) || Date.now(),
          filename: data.filename,
          originalName: data.originalName,
          mimeType: data.mimeType,
          size: data.size,
          type: data.type,
          latitude: data.latitude,
          longitude: data.longitude,
          locationName: data.locationName,
          locationAddress: data.locationAddress,
          createdAt: data.createdAt instanceof Timestamp 
            ? data.createdAt.toDate().toISOString() 
            : data.createdAt,
          analysis: data.analysis
        });
      });
      callback(mediaItems);
    });
  }

  subscribeToStatsUpdates(callback: (stats: Stats) => void): () => void {
    if (!auth.currentUser) {
      return () => {};
    }

    const statsRef = doc(db, collections.stats, auth.currentUser.uid);
    
    return onSnapshot(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          imagesCount: data.imagesCount || 0,
          videosCount: data.videosCount || 0,
          issuesCount: data.issuesCount || 0
        });
      }
    });
  }
}

export const firebaseService = new FirebaseService();
