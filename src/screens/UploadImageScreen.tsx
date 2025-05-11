// src/screens/UploadImageScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, StyleSheet, TextInput, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { storage, db } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { analyzeImageWithClarifai } from '../api/vision';
import { Ionicons } from '@expo/vector-icons';
import { removeBackground } from '../api/removeBackground';
import { analyzeLabelsWithOpenAI } from '../api/nlp';
import { analyzeImageWithGoogleVision } from '../api/vision_gg_cloud';
import { analyzeImageFull } from '../api/vision_combined';
import { getFirebaseAuth } from '../firebase/authProvider';


// Các options cho các thuộc tính
const options = {
  season: ['spring', 'summer', 'autumn', 'winter'],
  occasion: ['daily', 'school', 'work', 'party', 'date', 'formal', 'travel', 'wedding', 'beach', 'home', 'sport', 'special', 'etc'],
  color: ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'ivory', 'beige', 'light-gray', 'dark-gray', 'light-yellow', 'orange',
    'coral', 'hot-pink', 'light-green', 'sky-blue', 'navy', 'brown', 'dark-brown', 'gold', 'silver', 'purple', 'camel', 'colorful'],
  material: ['denim', 'cotton', 'leather', 'wool', 'polyester', 'nylon', 'linen', 'spandex', 'acrylic', 'silk', 'rayon', 'viscose', 'orther material'],
  pattern: ['solid', 'striped', 'plaid', 'polka dot', 'floral', 'checkerboard', 'argyle', 'color-block', 'gingham', 'repeated', 'geometric', 'orther pattern',],
  style: ['casual', 'sporty', 'formal', 'vintage', 'streetwear', 'comfortable', 'business casual', 'trendy', 'modern', 'classic', 'minimalist', 'bohemian',
    'luxury', 'athleisure', 'affordable', 'premium', 'kidcore', 'basic', 'artics', 'dress-up', 'hipster', 'feminine', 'chic', 'punk', 'kitsch', 'etc'],
  gender: ['man', 'woman', 'unisex'],
  categoryParent: ['dresses', 'tops', 'pants', 'skirts', 'outerwear', 'shoes', 'bags', 'headwear', 'jewelry', 'orther'],
  categoryChild: {
    dresses: ['mini dress', 'maxi dress', 't-shirt dresses', 'sweater dresses', 'jacket dresses', 'party dresses', 'jumpsuits', 'etc'],
    tops: ['t-shirt', 'blouses', 'sweater', 'polo', 'jersey', 'tanks', 'crop tops', 'shirts', 'hoodies', 'cardigans tops', 'sports tops', 'bodysuits', 'etc'],
    pants: ['jeans', 'shorts', 'trousers', 'leggings', 'etc'],
    skirts: ['mini skirts', 'midi skirts', 'maxi skirts', 'etc'],
    outerwear: ['jacket', 'coats', 'varsity', 'cardigans', 'vests', 'blazers', 'biker', 'sports jackets', 'bomber', 'etc'],
    shoes: ['sneakers', 'boots', 'heels', 'slip ons', 'sports shoes', 'sandals', 'slides', 'etc'],
    bags: ['tote', 'crossbody', 'shoulder', 'waist', 'canvas', 'backpacks', 'briefcases', 'suitcases', 'etc'],
    headwear: ['cap', 'hats', 'beanies', 'berets', 'sun hats', 'hijab', 'etc'],
    jewelry: ['earrings', 'necklaces', 'bracelets', 'rings', 'brooches', 'etc']
  },
};

const UploadImageScreen = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<any>(null);
  const [expandedFields, setExpandedFields] = useState<{ [key: string]: boolean }>({});

  const navigation = useNavigation();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Permission to access media library is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const pickedUri = result.assets[0].uri;
      setLoading(true);

      let finalUri = pickedUri; // Default là ảnh gốc

      try {
        const bgRemovedUri = await removeBackground(pickedUri);
        if (bgRemovedUri) {
          finalUri = bgRemovedUri; // Nếu tách nền ok, dùng ảnh đã tách
        }
      } catch (error) {
        console.log('Remove background failed, continue with original image.');
      }

      try {
        setImageUri(finalUri); // Dùng ảnh đã có (tách nền hoặc gốc)
        // const labels = await analyzeImageWithGoogleVision(finalUri);
        // const labels = await analyzeImageFull(finalUri);

        const labels = await analyzeImageWithClarifai(finalUri);
        console.log('Clarifai labels:', labels);

        // const aiResult = await analyzeLabelsWithOpenAI(labels);
        // console.log('AI attributes:', aiResult);

        setAttributes(labels);

      } catch (error) {
        console.error('Analyze image error:', error);
        Alert.alert('Error', 'Failed to analyze image.');
      }

      setLoading(false);
    }
  };


  const uploadImageToFirebase = async (uri: string, fileName: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileRef = ref(storage, `clothes/${fileName}`);
    const snapshot = await uploadBytes(fileRef, blob);
    return await getDownloadURL(snapshot.ref);
  };

  const saveImageToFirestore = async (imageUrl: string) => {
    const auth = getFirebaseAuth();

    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const clothesRef = collection(db, 'clothes');
    const newClothesDoc = doc(clothesRef);

    const defaultName = attributes?.category?.child?.[0] || '';

    await setDoc(newClothesDoc, {
      imageUrl,
      userId: user.uid,
      createdAt: new Date(),
      name: defaultName,
      ...attributes,
    });

    Alert.alert('Success', 'Clothing item saved successfully!');
    setImageUri(null);
    setAttributes(null);
    setDownloadURL(null);
    navigation.goBack();
  };


  const handleSave = async () => {
    if (!imageUri || !attributes) {
      Alert.alert('Missing data', 'Please pick an image and complete the attributes.');
      return;
    }
    setLoading(true);
    try {
      const fileName = `item-${Date.now()}.jpeg`;
      const uploadedUrl = await uploadImageToFirebase(imageUri, fileName);
      await saveImageToFirestore(uploadedUrl);
    } catch (error: any) {
      Alert.alert('Upload Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (field: string, value: string) => {
    setAttributes((prev: any) => {
      if (field === 'category') {
        // Nếu là category, đảm bảo có cả parent và child
        return {
          ...prev,
          category: {
            parent: prev.category?.parent || 'tops',  // Khởi tạo nếu không có
            child: prev.category?.child || [],
          },
        };
      }
      if (field === 'gender') {
        return { ...prev, [field]: value };
      }

      const currentValues = prev[field] || [];
      if (currentValues.includes(value)) {
        return { ...prev, [field]: currentValues.filter((v: string) => v !== value) };
      } else {
        return { ...prev, [field]: [...currentValues, value] };
      }
    });
  };

  const toggleExpand = (field: string) => {
    setExpandedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleParentSelect = (parent: string) => {
    setAttributes((prev: any) => ({
      ...prev,
      category: { parent, child: [] },
    }));
  };

  const handleCategoryChildChange = (child: string) => {
    setAttributes((prev: any) => {
      const currentChilds = prev.category?.child || [];
      if (currentChilds.includes(child)) {
        return { ...prev, category: { ...prev.category, child: currentChilds.filter((c: string) => c !== child) } };
      } else {
        return { ...prev, category: { ...prev.category, child: [...currentChilds, child] } };
      }
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Pick an Image</Text>
      </TouchableOpacity>

      {imageUri && (
        <>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />

          {attributes && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Edit Attributes</Text>

              {Object.keys(options).map((key) => (
                key !== 'categoryChild' && key !== 'categoryParent' && (
                  <View key={key} style={styles.inputGroup}>
                    <TouchableOpacity onPress={() => toggleExpand(key)} style={styles.expandHeader}>
                      <Text style={styles.label}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                      <Ionicons name={expandedFields[key] ? 'chevron-up' : 'chevron-down'} size={20} color="black" />
                    </TouchableOpacity>

                    <View style={styles.optionContainer}>
                      {(expandedFields[key] ? options[key] : (Array.isArray(attributes[key]) ? attributes[key] : [])).map((option: string) => {
                        const isSelected = key === 'gender'
                          ? attributes[key] === option
                          : attributes[key]?.includes?.(option);

                        return (
                          <TouchableOpacity
                            key={option}
                            style={[
                              styles.optionButton,
                              isSelected && styles.optionButtonSelected,
                            ]}
                            onPress={() => toggleSelection(key, option)}
                          >
                            <Text style={styles.optionText}>{option}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )
              ))}

              {/* Category */}
              <View style={styles.inputGroup}>
                <TouchableOpacity onPress={() => toggleExpand('category')} style={styles.expandHeader}>
                  <Text style={styles.label}>Category</Text>
                  <Ionicons name={expandedFields['category'] ? 'chevron-up' : 'chevron-down'} size={20} color="black" />
                </TouchableOpacity>

                {expandedFields['category'] && (
                  <>
                    <Text style={styles.subLabel}>Parent</Text>
                    <View style={styles.optionContainer}>
                      {options.categoryParent.map((parent) => (
                        <TouchableOpacity
                          key={parent}
                          style={[
                            styles.optionButton,
                            attributes.category?.parent === parent && styles.optionButtonSelected,
                          ]}
                          onPress={() => handleParentSelect(parent)}
                        >
                          <Text style={styles.optionText}>{parent}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {attributes.category?.parent && (
                      <>
                        <Text style={styles.subLabel}>Child</Text>
                        <View style={styles.optionContainer}>
                          {options.categoryChild[attributes.category.parent]?.map((child) => (
                            <TouchableOpacity
                              key={child}
                              style={[
                                styles.optionButton,
                                attributes.category.child?.includes(child) && styles.optionButtonSelected,
                              ]}
                              onPress={() => handleCategoryChildChange(child)}
                            >
                              <Text style={styles.optionText}>{child}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    )}
                  </>
                )}
              </View>

              <TouchableOpacity style={[styles.button, { backgroundColor: 'black', marginTop: 20 }]} onPress={handleSave}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {loading && <ActivityIndicator size="large" color="black" style={{ marginTop: 20 }} />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  button: { backgroundColor: 'black', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, marginVertical: 10 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  image: { width: '100%', height: 300, marginVertical: 20, borderRadius: 10 },
  form: { width: '100%', marginTop: 20, flex: 1, },
  formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600' },
  subLabel: { fontSize: 13, marginTop: 5, marginBottom: 3, color: 'gray' },
  optionContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionButton: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, margin: 4 },
  optionButtonSelected: { backgroundColor: 'white', borderColor: 'black' },
  optionText: { color: 'black' },
  expandHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
});

export default UploadImageScreen;
