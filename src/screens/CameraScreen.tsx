import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, queryKeys } from '../lib/api';
import { useAuth } from '../lib/authContext';

const { width, height } = Dimensions.get('window');

type CameraScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Camera'>;

const CameraScreen = () => {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const route = useRoute();
  const queryClient = useQueryClient();
  const cameraRef = useRef<CameraView>(null);
  const { user } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [flashMode, setFlashMode] = useState<'on' | 'off'>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Get mode from route params (photo or video)
  const mode = (route.params as any)?.mode || 'photo';

  useEffect(() => {
    getCurrentLocation();
    initializeAppDirectories();
  }, []);

  // Camera activation effect - helps with black screen issue
  useEffect(() => {
    if (permission?.granted) {
      // Small delay to ensure camera is properly initialized
      const timer = setTimeout(() => {
        setIsCameraActive(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [permission?.granted]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const initializeAppDirectories = async () => {
    try {
      const photosDir = `${FileSystem.documentDirectory}photos/`;
      const videosDir = `${FileSystem.documentDirectory}videos/`;

      // Create directories if they don't exist
      const photosInfo = await FileSystem.getInfoAsync(photosDir);
      if (!photosInfo.exists) {
        await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
      }

      const videosInfo = await FileSystem.getInfoAsync(videosDir);
      if (!videosInfo.exists) {
        await FileSystem.makeDirectoryAsync(videosDir, { intermediates: true });
      }
    } catch (error) {
      console.error('Error creating app directories:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const { street, city, region } = reverseGeocode[0];
        setAddress(`${street || ''} ${city || ''} ${region || ''}`.trim() || 'Unknown location');
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const saveToAppStorage = async (sourceUri: string, isVideo: boolean = false) => {
    try {
      const timestamp = Date.now();
      const fileExtension = isVideo ? 'mp4' : 'jpg';
      const fileName = `${isVideo ? 'video' : 'photo'}_${timestamp}.${fileExtension}`;
      const directory = isVideo ? 'videos' : 'photos';
      const destinationUri = `${FileSystem.documentDirectory}${directory}/${fileName}`;

      // Copy file to app storage
      await FileSystem.copyAsync({
        from: sourceUri,
        to: destinationUri,
      });

      console.log(`File saved to app storage: ${destinationUri}`);
      return destinationUri;
    } catch (error) {
      console.error('Error saving to app storage:', error);
      throw error;
    }
  };

  const uploadMutation = useMutation({
    mutationFn: (data: { file: any; latitude?: number; longitude?: number; locationAddress?: string }) =>
      apiClient.uploadMedia(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
      setIsUploading(false);
      Alert.alert(
        'Success',
        `${mode === 'photo' ? 'Photo' : 'Video'} saved and uploaded successfully`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Gallery'),
          },
        ]
      );
    },
    onError: (error) => {
      setIsUploading(false);
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Failed',
        `${mode === 'photo' ? 'Photo' : 'Video'} saved locally but upload failed. You can retry from Gallery.`,
        [{ text: 'OK' }]
      );
    },
  });

  const takePicture = async () => {
    if (cameraRef.current && cameraReady && isCameraActive) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });

        if (!photo) {
          Alert.alert('Error', 'Failed to capture photo');
          return;
        }

        await saveToAppStorage(photo.uri, false);
        navigation.navigate('Gallery');
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const recordVideo = async () => {
    if (cameraRef.current && cameraReady && isCameraActive) {
      try {
        if (isRecording) {
          cameraRef.current.stopRecording();
        } else {
          setIsRecording(true);
          const video = await cameraRef.current.recordAsync({
            maxDuration: 60,
          });

          setIsRecording(false);

          if (!video) {
            Alert.alert('Error', 'Failed to record video');
            return;
          }

          await saveToAppStorage(video.uri, true);
          navigation.navigate('Gallery');
        }
      } catch (error) {
        setIsRecording(false);
        console.error('Error recording video:', error);
        Alert.alert('Error', 'Failed to record video. Please try again.');
      }
    }
  };

  const toggleCameraType = () => {
    setCameraFacing(current =>
      current === 'back' ? 'front' : 'back'
    );
  };

  const toggleFlash = () => {
    setFlashMode(current =>
      current === 'off' ? 'on' : 'off'
    );
  };

  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Gallery');
    }
  };

  const onCameraReady = () => {
    console.log('Camera is ready');
    setCameraReady(true);
  };

  const onCameraError = (error: any) => {
    console.error('Camera error:', error);
    setCameraReady(false);
    setIsCameraActive(false);

    // Retry camera initialization after a short delay
    setTimeout(() => {
      console.log('Retrying camera initialization...');
      setIsCameraActive(true);
    }, 1000);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera and microphone to capture photos and videos.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Camera View - Only render when permissions granted and camera is active */}
      {isCameraActive && (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraFacing}
          flash={flashMode}
          mode={mode === 'photo' ? 'picture' : 'video'}
          onCameraReady={onCameraReady}
          onMountError={onCameraError}
        />
      )}

      {/* Loading indicator when camera is not ready */}
      {(!cameraReady || !isCameraActive) && (
        <View style={styles.cameraLoadingOverlay}>
          <Ionicons name="camera-outline" size={48} color="white" />
          <Text style={styles.cameraLoadingText}>
            {!isCameraActive ? 'Starting Camera...' : 'Initializing Camera...'}
          </Text>
        </View>
      )}

      {/* Overlay positioned absolutely on top */}
      <View style={styles.overlay}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.topCenter}>
            <Text style={styles.modeText}>
              {mode === 'photo' ? 'PHOTO' : 'VIDEO'}
            </Text>
            {isRecording && (
              <Text style={styles.recordingTime}>
                {formatRecordingTime(recordingTime)}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleFlash}
            activeOpacity={0.7}
          >
            <Ionicons
              name={flashMode === 'on' ? "flash" : "flash-off"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* Grid Overlay - Only show when camera is ready */}
        {cameraReady && isCameraActive && (
          <View style={styles.gridContainer}>
            <View style={styles.gridLine} />
            <View style={[styles.gridLine, { left: '66.66%' }]} />
            <View style={[styles.gridLine, { top: '33.33%' }, styles.gridLineHorizontal]} />
            <View style={[styles.gridLine, { top: '66.66%' }, styles.gridLineHorizontal]} />
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'photo' && styles.modeButtonActive]}
              onPress={() => navigation.setParams({ mode: 'photo' } as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeButtonText, mode === 'photo' && styles.modeButtonTextActive]}>
                Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'video' && styles.modeButtonActive]}
              onPress={() => navigation.setParams({ mode: 'video' } as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeButtonText, mode === 'video' && styles.modeButtonTextActive]}>
                Video
              </Text>
            </TouchableOpacity>
          </View>

          {/* Capture Controls */}
          <View style={styles.captureControls}>
            {/* Gallery Button */}
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={() => navigation.navigate('Gallery')}
              activeOpacity={0.7}
            >
              <Ionicons name="images" size={24} color="white" />
            </TouchableOpacity>

            {/* Capture Button */}
            <TouchableOpacity
              style={[
                styles.captureButton,
                isRecording && styles.captureButtonRecording,
                isUploading && styles.captureButtonUploading,
              ]}
              onPress={mode === 'photo' ? takePicture : recordVideo}
              disabled={isUploading || !cameraReady || !isCameraActive}
              activeOpacity={0.8}
            >
              {isRecording ? (
                <View style={styles.captureButtonInner}>
                  <View style={styles.stopIcon} />
                </View>
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>

            {/* Flip Camera Button */}
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraType}
              activeOpacity={0.7}
              disabled={!cameraReady || !isCameraActive}
            >
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    pointerEvents: 'box-none',
  },
  topCenter: {
    alignItems: 'center',
    pointerEvents: 'none',
  },
  modeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  recordingTime: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
    pointerEvents: 'none',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'white',
    width: 1,
    height: '100%',
    left: '33.33%',
  },
  gridLineHorizontal: {
    width: '100%',
    height: 1,
    left: 0,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    pointerEvents: 'box-none',
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    pointerEvents: 'box-none',
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    pointerEvents: 'auto',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  modeButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: 'white',
  },
  captureControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    pointerEvents: 'box-none',
  },
  galleryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto',
  },
  captureButtonRecording: {
    backgroundColor: '#EF4444',
  },
  captureButtonUploading: {
    backgroundColor: '#6B7280',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: 'white',
    borderRadius: 4,
  },
  flipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto',
  },
  cameraLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cameraLoadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  uploadingContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  uploadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
});

export default CameraScreen;