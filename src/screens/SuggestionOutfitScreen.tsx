import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db, storage } from '../firebase/config';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ClothingItem } from '../model/type';
import { captureRef } from 'react-native-view-shot';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { parse } from 'date-fns';
import ViewShot from 'react-native-view-shot';
import { getFirebaseAuth } from '../firebase/authProvider';

const SuggestionOutfitScreen = () => {
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<ClothingItem[][]>([]);
  const [loading, setLoading] = useState(true);
  const [hasClothes, setHasClothes] = useState(true);
  const outfitRefs = useRef<(ViewShot | null)[]>([]);
  const navigation = useNavigation<any>();

  const route = useRoute<any>();
  const { selectedOccasion, selectedStyle, personalColor, bodyType, temperatureLow, temperatureHigh, selectedWhen, where } = route.params;

  const parsedDate = parse(selectedWhen, 'dd/MM/yyyy', new Date());
  const usedDate = selectedWhen && !isNaN(parsedDate.getTime()) ? Timestamp.fromDate(parsedDate) : null;

  useEffect(() => {
    const fetchClothes = async () => {
      try {
        const clothesRef = collection(db, 'clothes');
        const snapshot = await getDocs(clothesRef);

        if (snapshot.empty) {
          setHasClothes(false);
          return;
        }

        const clothesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<ClothingItem, 'id'>)
        }));

        setClothes(clothesData);
      } catch (error) {
        console.error('Error fetching clothes:', error);
        setHasClothes(false);
      } finally {
        setLoading(false);
      }
    };

    fetchClothes();
  }, []);

  const fetchSuggestedOutfitsFromServer = async () => {
    try {
      const cleanedClothes = clothes.map(item => ({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        category: {
          parent: item.category?.parent || '',
          child: Array.isArray(item.category?.child) ? item.category?.child : [],
        },
        season: item.season || [],
        occasion: item.occasion || [],
        color: item.color || [],
        material: item.material || [],
        pattern: item.pattern || [],
        style: item.style || [],
        gender: typeof item.gender === 'string' ? item.gender : '',  // Đảm bảo gender là chuỗi
        embedding: item.embedding || [],
      }));



      if (cleanedClothes.length === 0) {
        throw new Error("No valid clothes found to send to the server");
      }

      const response = await fetch('http://192.168.1.17:8000/suggest-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clothes: cleanedClothes,
          selectedStyle: selectedStyle || '',
          selectedOccasion: selectedOccasion || '',
          temperatureLow: parseFloat(temperatureLow || '0'),
          temperatureHigh: parseFloat(temperatureHigh || '0'),
          personalColor,
          bodyType,
          location: where,
          when: selectedWhen,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Network response was not ok: ${errorText}`);
      }

      const result = await response.json();
      setOutfits(result.outfits);
    } catch (error) {
      console.error('Error fetching suggested outfits:', error);
    }
  };

  useEffect(() => {
    if (clothes.length > 0) {
      fetchSuggestedOutfitsFromServer();
    }
  }, [clothes]);

  const handleSaveOutfit = async (outfitIndex: number) => {
    try {
      const auth = getFirebaseAuth();

      const userID = auth.currentUser?.uid;

      if (!userID) {
        alert('User not authenticated. Please log in.');
        return;
      }


      const uri = await captureRef(outfitRefs.current[outfitIndex], {
        format: 'png',
        quality: 1,
      });

      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `outfit_${Date.now()}.png`;
      const imageRef = storageRef(storage, `outfits/${fileName}`);
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);

      await addDoc(collection(db, 'outfits'), {
        imageUrl: downloadURL,
        createdAt: Timestamp.now(),
        usedDate: usedDate,
        items: outfits[outfitIndex].map(item => ({
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
        })),
        style: selectedStyle,
        occasion: selectedOccasion,
        temperatureLow,
        temperatureHigh,
        location: where,
        userId: userID,
      });

      alert('Outfit saved successfully!');
    } catch (error) {
      console.error('Error saving outfit:', error);
      alert('Failed to save outfit.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  if (!hasClothes) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.noResultText}>Bạn chưa có quần áo nào trong tủ 🥲</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {outfits.length > 0 ? (
          outfits.map((outfit, index) => (
            <View key={index} style={styles.outfitContainer}>
              <Text style={styles.outfitTitle}>Outfit {index + 1}</Text>

              <ViewShot
                style={styles.itemRow}
                ref={(ref) => {
                  outfitRefs.current[index] = ref;
                }}
                options={{ format: "png", quality: 1 }}
              >
                {outfit.map(item => (
                  <Image key={item.id} source={{ uri: item.imageUrl }} style={styles.itemImage} />
                ))}
              </ViewShot>


              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleSaveOutfit(index)}
              >
                <Text style={styles.saveButtonText}>Save Outfit</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noResultText}>No matching outfits found 🥲</Text>
        )}
      </ScrollView>

      {/* Nút quay về AIStyling */}
      <TouchableOpacity
        style={styles.backToStylingButton}
        onPress={() => navigation.navigate('HomeTabs', { screen: 'AI Styling' })}
      >
        <Text style={styles.backToStylingButtonText}>Quay về AI Styling</Text>
      </TouchableOpacity>
    </View>
  );

};

export default SuggestionOutfitScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
  },
  outfitContainer: {
    marginBottom: 32,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'center',
  },
  outfitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  itemImage: {
    width: 100,
    height: 100,
    margin: 4,
    borderRadius: 10,
  },
  noResultText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
    color: 'gray',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: 'black',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  backToStylingButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    alignItems: 'center',
  },
  backToStylingButtonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
