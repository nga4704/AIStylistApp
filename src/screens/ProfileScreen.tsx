import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase/config';
import { getFirebaseAuth } from '../firebase/authProvider';

const ProfileScreen = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [avatarURL, setAvatarURL] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [personalColor, setPersonalColor] = useState(''); // New state for personal color
  const [loading, setLoading] = useState(true);
  const auth = getFirebaseAuth();

  const user = auth.currentUser;
  const storage = getStorage();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUsername(data.username || '');
          setEmail(data.email || '');
          setGender(data.gender || '');
          setBodyType(data.bodyType || '');
          setAvatarURL(data.avatarURL || '');
          setHeight(data.height || '');
          setWeight(data.weight || '');
          setPersonalColor(data.personalColor || ''); // Fetch personal color
        }
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      if (user) {
        const avatarRef = ref(storage, `avatars/${user.uid}.jpg`);
        await uploadBytes(avatarRef, blob);
        const downloadURL = await getDownloadURL(avatarRef);
        setAvatarURL(downloadURL);

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { avatarURL: downloadURL });

        alert('Avatar updated successfully!');
      }
    }
  };

  const handleSave = async () => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username,
        gender,
        bodyType,
        height,
        weight,
        personalColor, // Save the selected personal color
      });
      alert('Profile updated successfully!');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarContainer}>
          {avatarURL ? (
            <Image source={{ uri: avatarURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={{ color: 'gray' }}>Select Avatar</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            editable={false}
            style={[styles.input, { backgroundColor: '#f0f0f0', color: 'gray' }]}/>
          
          <Text style={styles.label}>Username</Text>
          <TextInput value={username} onChangeText={setUsername} style={styles.input} />

          {/* NEW: Height & Weight in same row */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                style={styles.input}
                placeholder="Height"
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                style={styles.input}
                placeholder="Weight"
              />
            </View>
          </View>

          <Text style={styles.label}>Gender</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={gender}
              onValueChange={(itemValue) => setGender(itemValue)}
              style={styles.picker}
              dropdownIconColor="black"
            >
              <Picker.Item label="Male" value="Male" />
              <Picker.Item label="Female" value="Female" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>

          <Text style={styles.label}>Body Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={bodyType}
              onValueChange={(itemValue) => setBodyType(itemValue)}
              style={styles.picker}
              dropdownIconColor="black"
            >
              <Picker.Item label="Triangle" value="Triangle" />
              <Picker.Item label="Inverted Triangle" value="Inverted Triangle" />
              <Picker.Item label="Hourglass" value="Hourglass" />
              <Picker.Item label="Rectangle" value="Rectangle" />
              <Picker.Item label="Oval" value="Oval" />
            </Picker>
          </View>

          {/* NEW: Personal Color Picker */}
          <Text style={styles.label}>Personal Color</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={personalColor}
              onValueChange={(itemValue) => setPersonalColor(itemValue)}
              style={styles.picker}
              dropdownIconColor="black"
            >
              <Picker.Item label="Warm Bright" value="warm-bright" />
              <Picker.Item label="Cool Soft" value="cool-soft" />
              <Picker.Item label="Warm Deep" value="warm-deep" />
              <Picker.Item label="Cool Vivid" value="cool-vivid" />
            </Picker>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  saveButton: {
    backgroundColor: 'black',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 0.48,
  },
});
