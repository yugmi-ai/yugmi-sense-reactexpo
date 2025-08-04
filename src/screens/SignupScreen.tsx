import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/authContext';
import { SignupData } from '../types';

type UserType = 'individual' | 'organization';

const SignupScreen = () => {

  const navigation = useNavigation();
  const { signup } = useAuth();

  // State for user type selection
  const [userType, setUserType] = useState<UserType>('individual');

  // State for user inputs
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State for organization inputs
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgAddress, setOrgAddress] = useState('');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- Signup Handler ---
  const handleSignup = async () => {
    // Basic validation (can be expanded)
    if (!firstName || !lastName || !email || !password || password != confirmPassword) {
      Alert.alert('Validation Error', 'Please fill all personal fields correctly.');
      console.log(firstName, lastName, email, password, confirmPassword)
      return;
    }

    let signupData: SignupData;

    if (userType === 'organization') {
      if (!orgName || !orgEmail || !orgPhone || !orgAddress) {
        Alert.alert('Validation Error', 'Please fill all organization fields.');
        return;
      }
      signupData = {
        userType: 'organization',
        firstName,
        lastName,
        email,
        password,
        organizationData: {
          name: orgName,
          email: orgEmail,
          phone: orgPhone,
          address: orgAddress,
        },
      };
    } else {
      signupData = {
        userType: 'individual',
        firstName,
        lastName,
        email,
        password,
      };
    }

    setIsLoading(true);
    try {
      await signup(signupData);
      // On success, auth state change will likely navigate user away
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Helper for Inputs ---
  const renderTextInput = (
    placeholder: string,
    value: string,
    setter: (text: string) => void,
    icon: keyof typeof Ionicons.glyphMap,
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default',
    autoCapitalize: 'none' | 'sentences' | 'words' | 'characters' = 'words'
  ) => (
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={20} color="#6B7280" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={setter}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/yugmi.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appName}>Yugmi Sense</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Create an Account</Text>

          {/* User Type Selector */}
          <View style={styles.userTypeContainer}>
            <TouchableOpacity
              style={[styles.userTypeButton, userType === 'individual' && styles.userTypeButtonActive]}
              onPress={() => setUserType('individual')}
            >
              <Ionicons name="person" size={20} color={userType === 'individual' ? '#FFF' : '#1D4ED8'} />
              <Text style={[styles.userTypeButtonText, userType === 'individual' && styles.userTypeButtonTextActive]}>
                Individual
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.userTypeButton, userType === 'organization' && styles.userTypeButtonActive]}
              onPress={() => setUserType('organization')}
            >
              <Ionicons name="business" size={20} color={userType === 'organization' ? '#FFF' : '#1D4ED8'} />
              <Text style={[styles.userTypeButtonText, userType === 'organization' && styles.userTypeButtonTextActive]}>
                Organization
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Personal Information</Text>
          {renderTextInput('First Name', firstName, setFirstName, 'person-circle-outline')}
          {renderTextInput('Last Name', lastName, setLastName, 'person-circle-outline')}
          {renderTextInput('Email Address', email, setEmail, 'mail-outline', 'email-address', 'none')}

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>


          {/* Organization Fields */}
          {userType === 'organization' && (
            <>
              <Text style={styles.sectionTitle}>Organization Information</Text>
              {renderTextInput('Organization Name', orgName, setOrgName, 'business-outline')}
              {renderTextInput('Organization Email', orgEmail, setOrgEmail, 'at-outline', 'email-address', 'none')}
              {renderTextInput('Phone Number', orgPhone, setOrgPhone, 'call-outline', 'phone-pad')}
              {renderTextInput('Address', orgAddress, setOrgAddress, 'location-outline')}
            </>
          )}

          {/* Signup Button */}
          <TouchableOpacity
            style={[styles.signupButton, isLoading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.signupButtonText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16
  },
  appName: {
    fontSize: 28,
    fontFamily: 'Montserrat-Bold',
    color: '#1D4ED8'
  },
  formContainer: {
    borderRadius: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20
  },
  userTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    borderRadius: 8,
  },
  userTypeButtonActive: {
    backgroundColor: '#1D4ED8'
  },
  userTypeButtonText: {
    marginLeft: 8,
    color: '#1D4ED8',
    fontFamily: 'Montserrat-Semibold',
  },
  userTypeButtonTextActive: {
    color: '#FFF'
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#374151',
    marginTop: 10,
    marginBottom: 10
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 50
  },
  inputIcon: {
    marginRight: 12
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#111827'
  },
  signupButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD'
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loginText: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
  loginLink: {
    color: '#1D4ED8',
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    marginLeft: 4
  },
});

export default SignupScreen;