import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/authContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../lib/firebase';

const ProfileScreen = () => {
    const navigation = useNavigation();
    const { user, logout } = useAuth();

    const [fullName, setFullName] = useState(user?.fullName || '');
    const [username, setUsername] = useState(user?.username || '');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadUserData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const userDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid || ''));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setFullName(userData.fullName || '');
                    setUsername(userData.username || '');
                }
            } catch (error) {
                console.error('Error loading user data:', error);
                Alert.alert('Error', 'Failed to load profile data');
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [user]);

    const handleSaveProfile = async () => {
        if (!user || !auth.currentUser) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                fullName,
                username,
                updatedAt: new Date().toISOString(),
            });

            await updateProfile(auth.currentUser, {
                displayName: fullName,
            });

            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout');
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

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1D4ED8" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <SafeAreaView style={styles.safeHeader}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#1D4ED8" />
                    </TouchableOpacity>

                    <Text style={styles.title}>Profile</Text>

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#1D4ED8" />
                        ) : (
                            <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.profileImageContainer}>
                    <View style={styles.profileImage}>
                        <Text style={styles.profileInitial}>
                            {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                        </Text>
                    </View>
                </View>

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
                                onChangeText={setFullName}
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
                                onChangeText={setUsername}
                                editable={isEditing}
                                placeholder="Enter your username"
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
                        <Ionicons name="log-out-outline" size={20} color="white" style={styles.logoutIcon} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeHeader: {
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'ios' ? 48 : 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        marginTop: 30,
        marginBottom: 40,
    },
    title: {
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
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
        marginVertical: 24,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
