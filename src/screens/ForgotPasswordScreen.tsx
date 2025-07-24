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

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const { forgotPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateEmail(email)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await forgotPassword(email);
      setIsSubmitted(true);
      Alert.alert(
        'Reset Email Sent',
        response.message || 'Password reset instructions have been sent to your email.'
      );
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      // Display the error message from Firebase (already formatted in auth context)
      Alert.alert(
        'Request Failed',
        error.message || 'Failed to process your request. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1D4ED8" />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/yugmi.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Yugmi Sense</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>
          
          {!isSubmitted ? (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onBlur={() => validateEmail(email)}
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

              <TouchableOpacity
                style={[styles.submitButton, (isLoading || !email) && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Send Reset Instructions</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
              <Text style={styles.successText}>
                Reset instructions sent! Check your email for further instructions.
              </Text>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate('Login' as never)}
              >
                <Text style={styles.loginButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Remember your password? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
              <Text style={styles.footerLink}>Login</Text>
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
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    marginTop: 50,
    marginBottom: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 8,
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
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  footerLink: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;