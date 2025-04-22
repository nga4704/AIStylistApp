import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

export default function HeaderWithUser() {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchUserInfo = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setAvatar(data.avatarURL || '');  
        setName(data.username || 'User');
      }
    };

    fetchUserInfo();
  }, []);

  // Hàm điều hướng tới màn hình Profile
  const navigateToProfile = () => {
    navigation.navigate('Profile');  
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={navigateToProfile}>
        <Image
          source={avatar ? { uri: avatar } : require('../assets/default-avatar.png')}
          style={styles.avatar}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={navigateToProfile}>
        <Text style={styles.name}>{name}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingRight: 30,  
    paddingLeft: 10,   
  },
  name: { 
    fontSize: 16, 
    fontWeight: 'bold',
    marginLeft: 10, 
  },
  avatar: { 
    width: 34, 
    height: 34, 
    borderRadius: 18, 
    backgroundColor: '#fff' 
  },
});
