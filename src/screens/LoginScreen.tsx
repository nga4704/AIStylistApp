import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { db } from '../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, onSnapshot, Timestamp, doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth } from '../firebase/authProvider';


type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email Format', 'Please enter a valid email address.');
      return;
    }

    try {
      const auth = getFirebaseAuth();

      await signInWithEmailAndPassword(auth, email, password);
      
      // Lưu thông tin vào AsyncStorage
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          await AsyncStorage.setItem('isLoggedIn', 'true');
          await AsyncStorage.setItem('userName', data.username || 'User');
          await AsyncStorage.setItem('userAvatar', data.avatarURL || '');
        }
      }

      Alert.alert('Login Success', 'You have logged in successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.replace('HomeTabs'),
        },
      ]);
    } catch (error: any) {
      console.log('Login error:', error.code);
      switch (error.code) {
        case 'auth/invalid-email':
          Alert.alert('Invalid Email', 'Please enter a valid email address.');
          break;
        case 'auth/user-not-found':
          Alert.alert('User Not Found', 'No account found with this email.');
          break;
        case 'auth/wrong-password':
          Alert.alert('Incorrect Password', 'The password you entered is incorrect.');
          break;
        default:
          Alert.alert('Login failed', error.message);
          break;
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acloset Login</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholderTextColor="#888"
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <Text onPress={() => navigation.navigate('Register')} style={styles.link}>
        Don't have an account? Register
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, marginBottom: 20, fontWeight: 'bold', textAlign: 'center', color: '#000' },
  input: { borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 20, padding: 10, color: '#000' },
  button: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 20,
    textAlign: 'center',
    color: '#000',
    textDecorationLine: 'underline',
  },
});
