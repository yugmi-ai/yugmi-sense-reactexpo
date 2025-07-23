import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

export const saveToLibrary = async (uri: string) => {
  try {
    // Request permissions first
    const { status } = await MediaLibrary.requestPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Media library permission is needed to save photos and videos. You can still upload them to the server.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Try to save to library
    await MediaLibrary.saveToLibraryAsync(uri);
    return true;
  } catch (error) {
    console.warn('Could not save to media library:', error);
    
    // In Expo Go, this will fail - show helpful message
    Alert.alert(
      'Save Limitation',
      'Due to Expo Go limitations, media cannot be saved to your device gallery. However, it will be uploaded to the server for analysis.',
      [{ text: 'OK' }]
    );
    return false;
  }
};

export const checkMediaLibraryPermissions = async () => {
  try {
    const { status } = await MediaLibrary.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Could not check media library permissions:', error);
    return false;
  }
};
