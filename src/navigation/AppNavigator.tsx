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
import ProfileScreen from '../screens/ProfileScreen';
import HeaderWithUser from '../components/Header';
import UploadImageScreen from '../screens/UploadImageScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import { ClothingItem } from '../model/type';
import { Outfit } from '../model/outfit';
import OccasionDetailScreen from '../screens/OccasionDetailScreen';
import SuggestionOutfitScreen from '../screens/SuggestionOutfitScreen';
import OutfitDetailScreen from '../screens/OutfitDetailScreen';
import UploadOutfitScreen from '../screens/UploadOutfitScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  HomeTabs: undefined;
  Profile: undefined;
  Closet: undefined;
  UploadImageScreen: undefined;
  AIStylingScreen: undefined;
  ItemDetailScreen: { item: ClothingItem };
  OccasionDetailScreen: { selectedOccasion: string };
  SuggestionOutfitScreen: {
    selectedOccasion: any;
    selectedStyle: string;
    personalColor: string;
    bodyType: string;
    temperatureLow: string;
    temperatureHigh: string;
    selectedWhen: string;
    where: string;
    selectedItems: string[];
  };
  OutfitDetailScreen: {outfit: Outfit};
  UploadOutfitScreen: { outfitId: string };


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
    return null;
  }

  return (
    <Stack.Navigator initialRouteName={isLoggedIn ? 'HomeTabs' : 'Login'}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HomeTabs" component={HomeTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Closet" component={ClosetScreen} options={{ headerShown: false }} />
      <Stack.Screen name="UploadImageScreen" component={UploadImageScreen} />
      <Stack.Screen name="ItemDetailScreen" component={ItemDetailScreen} />
      <Stack.Screen name="OccasionDetailScreen" component={OccasionDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SuggestionOutfitScreen" component={SuggestionOutfitScreen} />
      <Stack.Screen name="OutfitDetailScreen" component={OutfitDetailScreen} />
      <Stack.Screen name="UploadOutfitScreen" component={UploadOutfitScreen} />

    </Stack.Navigator>
  );
}

