import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, ScrollView, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import axios from 'axios';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage, db } from '../firebase/config';  // Import Firestore
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

type AIProcessingRouteProp = RouteProp<RootStackParamList, 'AIProcessing'>;

const AIProcessingScreen = () => {
  const route = useRoute<AIProcessingRouteProp>();
  const { images, userID } = route.params;  // Receive userID as a prop

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const removeBackground = async (uri: string): Promise<Blob> => {
    const formData = new FormData();
    formData.append('image_file', {
      uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any);
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': 'Fa1TBt4z7sxcSGYP1kz8eeJo',
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Remove.bg failed');
    return await response.blob();
  };

  const uploadToFirebase = async (blob: Blob, fileName: string): Promise<string> => {
    const fileRef = ref(storage, `processed/${fileName}`);
    await uploadBytes(fileRef, blob);
    return await getDownloadURL(fileRef);
  };

  const saveToFirestore = async (imageUrl: string) => {
    const clothesRef = collection(db, 'clothes');
    const newClothesDoc = doc(clothesRef);  
    await setDoc(newClothesDoc, {
      imageUrl,
      userID,
      createdAt: new Date(),
    });
  };

  const analyzeImage = async (imageUrl: string): Promise<any> => {
    const response = await axios.post(
      'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyCYULoUgeYRgrQb8knrySFmKabX9nzd21A',
      {
        requests: [
          {
            image: {
              source: {
                imageUri: imageUrl,
              },
            },
            features: [
              {
                type: 'LABEL_DETECTION',
                maxResults: 10,
              },
            ],
          },
        ],
      }
    );
    return response.data;
  };
  

  useEffect(() => {
    (async () => {
      try {
        let allResults = [];

        for (const [index, uri] of images.entries()) {
          // 1. Remove background
          const bgRemovedBlob = await removeBackground(uri);

          // 2. Upload to Firebase Storage
          const imageUrl = await uploadToFirebase(bgRemovedBlob, `item-${Date.now()}-${index}.png`);

          // 3. Save image URL to Firestore
          await saveToFirestore(imageUrl);

          // 4. Send to AI server to analyze
          const result = await analyzeImage(imageUrl);

          allResults.push({ imageUrl, ...result });
        }

        setResults(allResults);
        setLoading(false);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Something went wrong during processing.');
        setLoading(false);
      }
    })();
  }, [images, userID]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
        <Text style={{ marginTop: 12 }}>Processing your outfits...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {results.map((item, index) => (
        <View key={index} style={styles.card}>
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
          <Text style={styles.title}>Detected Info:</Text>
          <Text>👕 Type: {item.type}</Text>
          <Text>🎨 Color: {item.color}</Text>
          <Text>🧵 Material: {item.material}</Text>
          <Text>🖼 Pattern: {item.pattern}</Text>
          <Text>🌦 Season: {item.season}</Text>
          <Text>🎉 Occasion: {item.occasion}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
});

export default AIProcessingScreen;
