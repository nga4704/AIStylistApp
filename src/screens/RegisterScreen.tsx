import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db } from '../firebase/config';
import { setDoc, doc } from 'firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getFirebaseAuth } from '../firebase/authProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const genders = ['Male', 'Female', 'Other'];

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('Male');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !gender) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    try {
      const auth = getFirebaseAuth();

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update displayName cho user trong Firebase Auth
      await updateProfile(user, {
        displayName: name,
      });

      // Lưu thông tin người dùng vào Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        username: name,
        gender: gender,
        avatarURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => navigation.replace('Login') },
      ]);
    } catch (error: any) {
      console.log('Registration error:', error.code);
      switch (error.code) {
        case 'auth/email-already-in-use':
          Alert.alert('Email in Use', 'This email is already registered.');
          break;
        case 'auth/invalid-email':
          Alert.alert('Invalid Email', 'Please enter a valid email address.');
          break;
        case 'auth/weak-password':
          Alert.alert('Weak Password', 'Password must be at least 6 characters.');
          break;
        default:
          Alert.alert('Registration Failed', error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      <TextInput
        placeholder="Username"
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholderTextColor="#888"
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor="#888"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholderTextColor="#888"
      />

      <TextInput
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.genderContainer}>
        {genders.map((g) => (
          <TouchableOpacity
            key={g}
            style={[
              styles.genderOption,
              gender === g && styles.genderOptionSelected,
            ]}
            onPress={() => setGender(g)}
          >
            <Text style={[
              styles.genderText,
              gender === g && styles.genderTextSelected
            ]}>
              {g}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <Text onPress={() => navigation.navigate('Login')} style={styles.link}>
        Already have an account? Login
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, marginBottom: 20, fontWeight: 'bold', textAlign: 'center', color: '#000' },
  input: { borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 20, padding: 10, color: '#000' },
  label: { fontSize: 16, marginBottom: 10, color: '#000', fontWeight: '600' },
  genderContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  genderOption: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  genderOptionSelected: {
    backgroundColor: '#000',
  },
  genderText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  genderTextSelected: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { marginTop: 20, textAlign: 'center', color: '#000', textDecorationLine: 'underline' },
});
