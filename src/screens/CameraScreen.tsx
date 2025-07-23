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
import { saveToLibrary } from '../lib/mediaLibrary';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, queryKeys } from '../lib/api';

const { width, height } = Dimensions.get('window');

type CameraScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Camera'>;

const CameraScreen = () => {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const route = useRoute();
  const queryClient = useQueryClient();
  const cameraRef = useRef<CameraView>(null);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [flashMode, setFlashMode] = useState<'on' | 'off'>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Get mode from route params (photo or video)
  const mode = (route.params as any)?.mode || 'photo';

  useEffect(() => {
    getCurrentLocation();
  }, []);

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

  const uploadMutation = useMutation({
    mutationFn: (data: { file: any; latitude?: number; longitude?: number; locationAddress?: string }) =>
      apiClient.uploadMedia(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
      setIsUploading(false);
      Alert.alert(
        'Success',
        `${mode === 'photo' ? 'Photo' : 'Video'} uploaded successfully`,
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
        'Failed to upload media. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  const takePicture = async () => {
    if (cameraRef.current && !isUploading) {
      try {
        setIsUploading(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });

        if (!photo) {
          setIsUploading(false);
          Alert.alert('Error', 'Failed to capture photo');
          return;
        }

        // Try to save to device gallery (with proper error handling)
        await saveToLibrary(photo.uri);

        // Create file object for upload
        const fileData = {
          uri: photo.uri,
          type: 'image/jpeg',
          name: `photo_${Date.now()}.jpg`,
        };

        uploadMutation.mutate({
          file: fileData as any,
          latitude: location?.coords.latitude,
          longitude: location?.coords.longitude,
          locationAddress: address,
        });
      } catch (error) {
        setIsUploading(false);
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const recordVideo = async () => {
    if (cameraRef.current) {
      try {
        if (isRecording) {
          // Stop recording
          cameraRef.current.stopRecording();
        } else {
          // Start recording
          setIsRecording(true);
          const video = await cameraRef.current.recordAsync({
            maxDuration: 60, // 60 seconds max
          });

          setIsRecording(false);
          
          if (!video) {
            Alert.alert('Error', 'Failed to record video');
            return;
          }
          
          setIsUploading(true);

          // Try to save to device gallery (with proper error handling)
          await saveToLibrary(video.uri);

          // Create file object for upload
          const fileData = {
            uri: video.uri,
            type: 'video/mp4',
            name: `video_${Date.now()}.mp4`,
          };

          uploadMutation.mutate({
            file: fileData as any,
            latitude: location?.coords.latitude,
            longitude: location?.coords.longitude,
            locationAddress: address,
          });
        }
      } catch (error) {
        setIsRecording(false);
        setIsUploading(false);
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
      
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraFacing}
        flash={flashMode}
        mode="picture"
      >
        <View style={styles.overlay}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => navigation.goBack()}
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
            >
              <Ionicons 
                name={flashMode === 'on' ? "flash" : "flash-off"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </View>

          {/* Grid Overlay */}
          <View style={styles.gridContainer}>
            <View style={styles.gridLine} />
            <View style={[styles.gridLine, { left: '66.66%' }]} />
            <View style={[styles.gridLine, { top: '33.33%' }, styles.gridLineHorizontal]} />
            <View style={[styles.gridLine, { top: '66.66%' }, styles.gridLineHorizontal]} />
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {/* Mode Selector */}
            <View style={styles.modeSelector}>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'photo' && styles.modeButtonActive]}
                onPress={() => navigation.setParams({ mode: 'photo' } as any)}
              >
                <Text style={[styles.modeButtonText, mode === 'photo' && styles.modeButtonTextActive]}>
                  Photo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'video' && styles.modeButtonActive]}
                onPress={() => navigation.setParams({ mode: 'video' } as any)}
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
                disabled={isUploading}
              >
                {isUploading ? (
                  <View style={styles.captureButtonInner}>
                    <Ionicons name="hourglass" size={24} color="white" />
                  </View>
                ) : isRecording ? (
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
              >
                <Ionicons name="camera-reverse" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CameraView>
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
    flex: 1,
    backgroundColor: 'transparent',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  topCenter: {
    alignItems: 'center',
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
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
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
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
  },
  galleryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
});

export default CameraScreen;
