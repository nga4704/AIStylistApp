import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Import icon library
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ClosetScreen from '../screens/ClosetScreen';
import AIStylingScreen from '../screens/AIStylingScreen';
import SettingScreen from '../screens/SettingScreen';
import AddItemScreen from '../screens/AddItemScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AIProcessing from '../screens/AIProcessing';
import HeaderWithUser from '../components/Header';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  HomeTabs: undefined;
  AddItem: undefined;
  AIProcessing: { images: string[]; userID: string };
  Profile: undefined;
  Closet: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const HomeTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerRight: () => <HeaderWithUser />,
      headerTitleAlign: 'left',
      tabBarActiveTintColor: 'black', 
      tabBarInactiveTintColor: 'gray',  
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="home-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Closet"
      component={ClosetScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="shirt-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="AI Styling"
      component={AIStylingScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="color-palette-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Setting"
      component={SettingScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="settings-outline" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

export default function AppNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const userLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      setIsLoggedIn(userLoggedIn === 'true');
    };
    checkLoginStatus();
  }, []);

  if (isLoggedIn === null) {
    // Show a loading screen while checking the login status
    return null;
  }

  return (
    <Stack.Navigator initialRouteName={isLoggedIn ? 'HomeTabs' : 'Login'}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HomeTabs" component={HomeTabs} options={{ headerShown: false }} />
      <Stack.Screen name="AddItem" component={AddItemScreen} />
      <Stack.Screen name="AIProcessing" component={AIProcessing}  />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Closet" component={ClosetScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
