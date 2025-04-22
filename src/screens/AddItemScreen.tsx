import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { auth, db } from '../firebase/config';

const MAX_SELECTION = 10;

const AddItemScreen = () => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [libraryImages, setLibraryImages] = useState<any[]>([]); // State for library images
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'AddItem'>>();
  const layout = Dimensions.get('window');
  const userID = auth.currentUser?.uid;

  useEffect(() => {
    // Get images from the media library
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access media library is required!');
        return;
      }

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 1000, // Number of images to load
        sortBy: [[MediaLibrary.SortBy.creationTime, false]], // Sort by creation time
      });

      const uris = media.assets.map((asset) => asset.uri);
      setGalleryImages(uris);
      setLoading(false); // Set loading to false after images are loaded
    })();

    const fetchLibraryImages = async () => {
      const API_KEY = 'Cqomsa62T6kY9bURpQy97iNwVdzCx3V2NJjlPqXnhNoqHhOwofe9V7K1'; // Your API key
      const queries = [  'Tops',  'Dresses',  'Pants',  'Shoes',  'Bags',  'Headwear',  'Jewelry']; // Các keyword cụ thể
      const perPage = 50; 
    
      try {
        let allImages: any[] = [];
    
        for (const query of queries) {
          const response = await fetch(
            `https://api.pexels.com/v1/search?query=${query}&per_page=${perPage}`, {
              headers: {
                Authorization: API_KEY,
              },
            }
          );
    
          if (!response.ok) {
            throw new Error(`Failed to fetch ${query} images`);
          }
    
          const data = await response.json();
          allImages = [...allImages, ...data.photos];
        }
    
        setLibraryImages(allImages); // Merge all 3 categories into 1 list
      } catch (error) {
        console.error('Error fetching library images:', error);
      }
    };
    

    fetchLibraryImages(); // Call the function to fetch library images
  }, []);

  const toggleSelectImage = (uri: string) => {
    if (selectedImages.includes(uri)) {
      setSelectedImages(selectedImages.filter((item) => item !== uri));
    } else {
      if (selectedImages.length >= MAX_SELECTION) {
        Alert.alert('Limit Reached', 'You can select up to 10 photos only.');
        return;
      }
      setSelectedImages([...selectedImages, uri]);
    }
  };

  const goToAIProcessingScreen = (images: string[]) => {
    navigation.navigate('AIProcessing', {
      images: images,
      userID: userID, // Truyền userID vào
    });
  };

  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const newUri = result.assets[0].uri;
      setGalleryImages([newUri, ...galleryImages]);
  
      if (selectedImages.length < MAX_SELECTION) {
        setSelectedImages((prev) => [...prev, newUri]);
      } else {
        Alert.alert('Limit Reached', 'You can select up to 10 photos only.');
      }
    }
  };
  

  const pickFromAlbum = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      selectionLimit: MAX_SELECTION - selectedImages.length,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
  
    if (!result.canceled && result.assets?.length > 0) {
      const newUris = result.assets.map((a) => a.uri);
      setGalleryImages([...newUris, ...galleryImages]);
  
      const filteredNewUris = newUris.filter((uri) => !selectedImages.includes(uri));
      const availableSlots = MAX_SELECTION - selectedImages.length;
      const urisToAdd = filteredNewUris.slice(0, availableSlots);
  
      if (availableSlots === 0) {
        Alert.alert('Limit Reached', 'You have already selected 10 photos.');
      } else {
        setSelectedImages((prev) => [...prev, ...urisToAdd]);
      }
    }
  };
  

  const renderImage = ({ item }: { item: string }) => {
    const isSelected = selectedImages.includes(item);
    return (
      <TouchableOpacity onPress={() => toggleSelectImage(item)} style={styles.imageWrapper}>
        <Image source={{ uri: item }} style={styles.image} />
        {isSelected && <View style={styles.checkedOverlay}><Text style={styles.checkmark}>✓</Text></View>}
      </TouchableOpacity>
    );
  };

  const renderLibraryImage = ({ item }: { item: any }) => {
    const uri = item.src.medium;
    const isSelected = selectedImages.includes(uri);
    
    return (
      <TouchableOpacity onPress={() => toggleSelectImage(uri)} style={styles.imageWrapper}>
        <Image source={{ uri }} style={styles.image} />
        {isSelected && (
          <View style={styles.checkedOverlay}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  

  const PhotosRoute = () => (
    <View style={{ flex: 1, padding: 10 }}>
      <View style={styles.photoButtons}>
        <TouchableOpacity onPress={openCamera} style={styles.photoButton}>
          <Text>📸 Take a Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={pickFromAlbum} style={styles.photoButton}>
          <Text>🖼 Albums</Text>
        </TouchableOpacity>
      </View>
      {loading ? ( 
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={galleryImages}
          keyExtractor={(uri) => uri}
          renderItem={renderImage}
          numColumns={3}
          contentContainerStyle={{ paddingBottom: 60 }}
        />
      )}
      {selectedImages.length > 0 && (
        <TouchableOpacity onPress={() => goToAIProcessingScreen(selectedImages)} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add {selectedImages.length} Item(s)</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const LibraryRoute = () => (
    <View style={styles.centered}>
      <FlatList
        data={libraryImages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderLibraryImage}
        numColumns={3}
        contentContainerStyle={{ paddingBottom: 60 }}
      />
      {selectedImages.length > 0 && (
        <TouchableOpacity onPress={() => goToAIProcessingScreen(selectedImages)} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add {selectedImages.length} Item(s)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'photos', title: 'Photos' },
    { key: 'library', title: 'Library' },
  ]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={SceneMap({
          photos: PhotosRoute,
          library: LibraryRoute,
        })}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: 'black' }}
            style={{ backgroundColor: 'white' }}
            activeColor="black"
            inactiveColor="#888"
            labelStyle={{ fontWeight: '600' }}
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  photoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  photoButton: {
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 8,
  },
  imageWrapper: {
    position: 'relative',
    margin: 5,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  checkedOverlay: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'black',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'black',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AddItemScreen;  