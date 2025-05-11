import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { RootStackParamList } from '../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type OutfitDetailRouteProp = RouteProp<RootStackParamList, 'OutfitDetailScreen'>;

const OutfitDetailScreen = () => {
  const route = useRoute<OutfitDetailRouteProp>();
  type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
  const navigation = useNavigation<NavigationProp>();

  const { outfit } = route.params;
  const [isFavorite, setIsFavorite] = useState(outfit.favorite); // 🔑

  const handleToggleFavorite = async () => {
    const newFavorite = !isFavorite;
    setIsFavorite(newFavorite); // Update UI immediately

    try {
      await updateDoc(doc(db, 'outfits', outfit.id), {
        favorite: newFavorite,
      });
    } catch (error) {
      console.error('Error updating favorite:', error);
      setIsFavorite(!newFavorite); // Revert if failed
    }
  };

  const handleDelete = async () => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this outfit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'outfits', outfit.id));
            navigation.goBack();
          } catch (error) {
            console.error('Error deleting outfit:', error);
          }
        },
      },
    ]);
  };

  const handleUpload = () => {
    navigation.navigate('UploadOutfitScreen', { outfitId: outfit.id });
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: outfit.imageUrl }} style={styles.image} resizeMode="contain" />

      <View style={styles.iconRow}>
        <TouchableOpacity onPress={handleToggleFavorite}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={30}
            color={isFavorite ? 'red' : 'black'}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={30} color="black" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleUpload}>
          <Ionicons name="cloud-upload-outline" size={30} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OutfitDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // padding: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
    
  },
  image: {
    width: '100%',
    height: '70%',
    borderRadius: 12,
  },
  iconRow: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-around',
    width: '60%',
  },
});
