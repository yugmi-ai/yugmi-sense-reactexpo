import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/authContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors, useTheme } from '@crossbuildui/core';

const ProfileScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const isMountedRef = useRef(true);

    const styles = getStyles(colors);

    const { user, logout } = useAuth();

    const [fullName, setFullName] = useState(user?.fullName || '');
    const [username, setUsername] = useState(user?.username || '');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Safe state setter that checks if component is still mounted
    const safeSetState = useCallback((setter: Function, value: any) => {
        if (isMountedRef.current) {
            setter(value);
        }
    }, []);

    // Track component mount status
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Use useFocusEffect instead of useEffect to ensure proper cleanup
    useFocusEffect(
        useCallback(() => {
            const loadUserData = async () => {
                if (!user || !isMountedRef.current) return;

                safeSetState(setIsLoading, true);

                try {
                    const userDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid || ''));

                    if (userDoc.exists() && isMountedRef.current) {
                        const userData = userDoc.data();
                        safeSetState(setFullName, userData.fullName || '');
                        safeSetState(setUsername, userData.username || '');
                    }
                } catch (error) {
                    console.error('Error loading user data:', error);
                    if (isMountedRef.current) {
                        Alert.alert('Error', 'Failed to load profile data');
                    }
                } finally {
                    safeSetState(setIsLoading, false);
                }
            };

            loadUserData();
        }, [user, safeSetState])
    );

    const handleSaveProfile = async () => {
        if (!user || !auth.currentUser || !isMountedRef.current) return;

        safeSetState(setIsSaving, true);

        try {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                fullName,
                username,
                updatedAt: new Date().toISOString(),
            });

            await updateProfile(auth.currentUser, {
                displayName: fullName,
            });

            if (isMountedRef.current) {
                safeSetState(setIsEditing, false);
                Alert.alert('Success', 'Profile updated successfully');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            if (isMountedRef.current) {
                Alert.alert('Error', 'Failed to update profile');
            }
        } finally {
            safeSetState(setIsSaving, false);
        }
    };

    const handleLogout = async () => {
        try {
            // Set a flag to prevent state updates during logout
            isMountedRef.current = false;
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
            if (isMountedRef.current) {
                Alert.alert('Error', 'Failed to logout');
            }
        }
    };

    const confirmLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', onPress: handleLogout, style: 'destructive' },
            ]
        );
    };

    // Early return with loading if component is not mounted or loading
    if (!isMountedRef.current || isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1D4ED8" />
            </View>
        );
    }

    return (
        <View
            style={[styles.container, { paddingTop: insets.top }]}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        // Prevent navigation if component is unmounting
                        if (isMountedRef.current) {
                            navigation.goBack();
                        }
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color="#1D4ED8" />
                </TouchableOpacity>

                <Text style={styles.title}>Profile</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.formContainer}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: '#6B7280' }]}
                                value={user?.email || ''}
                                editable={false}
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={(text) => {
                                    if (isMountedRef.current) {
                                        setFullName(text);
                                    }
                                }}
                                editable={isEditing}
                                placeholder="Enter your full name"
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Username</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="at-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={username}
                                onChangeText={(text) => {
                                    if (isMountedRef.current) {
                                        setUsername(text);
                                    }
                                }}
                                editable={isEditing}
                                placeholder="Enter your username"
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={confirmLogout}
                        disabled={isSaving}
                    >
                        <Ionicons name="log-out-outline" size={20} color="white" style={styles.logoutIcon} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 16,
        gap: 16,
    },
    title: {
        fontSize: 22,
        fontFamily: 'Montserrat-Bold',
        color: colors.foreground,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#E0E7FF',
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1D4ED8',
    },
    profileImageContainer: {
        alignItems: 'center',
        marginVertical: 16,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1D4ED8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitial: {
        fontSize: 40,
        fontWeight: '600',
        color: 'white',
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginHorizontal: 16,
        padding: 24,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 50,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#111827',
    },
    logoutButton: {
        backgroundColor: '#EF4444',
        borderRadius: 8,
        height: 50,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    logoutIcon: {
        marginRight: 8,
    },
    logoutText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ProfileScreen;