// firebase/authProvider.ts
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { app } from './config';

let auth;

export const getFirebaseAuth = () => {
  if (!auth) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
  return auth;
};
