import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';  // Import kiểu RootStackParamList
import { db } from '../firebase/config';
import { getFirebaseAuth } from '../firebase/authProvider';

const SettingScreen = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Sử dụng navigation với kiểu đúng
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    // Thêm logic chuyển theme 
  };

  const toggleNotifications = () => {
    setNotificationsEnabled((prev) => !prev);
    // Thêm logic xử lý thông báo
  };

  const handleManageAccount = () => {
    navigation.navigate('Profile');
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Log Out',
        onPress: async () => {
          await AsyncStorage.removeItem('isLoggedIn');
          const auth = getFirebaseAuth();

          auth.signOut();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Theme Section */}
      <Text style={styles.sectionTitle}>Theme</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Dark Mode</Text>
        <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
      </View>

      {/* Notification Section */}
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Enable Notifications</Text>
        <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />
      </View>

      {/* Account Section */}
      <Text style={styles.sectionTitle}>Account</Text>
      <TouchableOpacity style={styles.row} onPress={handleManageAccount}>
        <Text style={styles.label}>Manage Account</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} onPress={handleLogout}>
        <Text style={styles.label}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 16,
  },
});

export default SettingScreen;
