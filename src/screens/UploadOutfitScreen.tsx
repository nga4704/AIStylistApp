import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  FlatList, TextInput, ScrollView, Alert, 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db} from '../firebase/config';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { getFirebaseAuth } from '../firebase/authProvider';

const styleOptions = [
  'casual', 'business casual', 'formal', 'modern', 'classic', 'minimalist',
  'bohemian', 'luxury', 'sporty', 'athleisure', 'trendy', 'kidcore',
  'artistic', 'dress-up', 'feminine', 'street', 'etc',
];

const occasionOptions = [
  'daily', 'work', 'date', 'formal', 'travel', 'home', 'party',
  'sport', 'special', 'school', 'beach', 'etc',
];

const seasonOptions = ['Spring', 'Summer', 'Fall', 'Winter'];

const UploadOutfitScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { outfitId } = route.params as { outfitId: string };

  const [images, setImages] = useState<string[]>([]);
  const [style, setStyle] = useState(''); 
  const [occasion, setOccasion] = useState('');
  const [season, setSeason] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [inputHashtag, setInputHashtag] = useState('');
  const [rating, setRating] = useState(0);
  const [postContent, setPostContent] = useState('');
  const auth = getFirebaseAuth();

  const userId = auth.currentUser?.uid;
  const like = 0;
  if (!userId) {
    Alert.alert('User not authenticated');
    return;
  }
  
  useEffect(() => {
    const fetchOutfit = async () => {
      try {
        const docRef = doc(db, 'outfits', outfitId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Fetched outfit data:', data);
          
          // Lấy giá trị style và occasion từ Firestore và cập nhật vào state
          setImages(data.images || (data.imageUrl ? [data.imageUrl] : []));
          setStyle(Array.isArray(data.style) ? data.style[0] : data.style || '');  // Set style
          setOccasion(Array.isArray(data.occasion) ? data.occasion[0] : data.occasion || '');  // Set occasion
          setSeason(data.season || '');
        } else {
          Alert.alert('Outfit not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error fetching outfit:', error);
        Alert.alert('Failed to load outfit.');
        navigation.goBack();
      }
    };
  
    fetchOutfit();
  }, [outfitId]);  // Chú ý thêm outfitId vào dependency array
  
 

  const handleAddHashtag = () => {
    if (inputHashtag.trim() && !hashtags.includes(inputHashtag.trim())) {
      setHashtags([...hashtags, inputHashtag.trim()]);
      setInputHashtag('');
    }
  };

  const handleUpload = async () => {
    if (!postContent.trim()) {
      Alert.alert('Please enter a post description.');
      return;
    }
    console.log('Hashtags before upload:', hashtags);

    try {
      await addDoc(collection(db, 'posts'), {
        userId,
        outfitId,
        images,
        style,
        occasion,
        season,
        // hashtags,
        like,
        content: postContent,
        createdAt: Timestamp.now(),
      });

      Alert.alert('Post uploaded!');
      navigation.goBack();
    } catch (error) {
      console.error('Error uploading post:', error);
      Alert.alert('Upload failed.');
    }
  };

  const renderOptionGroup = (
    label: string,
    options: string[],
    selected: string,
    setSelected: (val: string) => void
  ) => (
    <View style={{ width: '100%', marginTop: 20 }}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <View style={styles.dropdownArrowWrapper}>
        <Text style={styles.dropdownArrow}>▼</Text>
      </View>
      <View style={styles.optionGroup}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.optionItem,
              selected === opt && styles.optionItemSelected,
            ]}
            onPress={() => setSelected(opt)}
          >
            <Text
              style={[
                styles.optionText,
                selected === opt && styles.optionTextSelected,
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Upload Post</Text>

      <FlatList
        data={images}
        horizontal
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={styles.imageBox}
            onError={() => console.log('Invalid image URI:', item)}
          />
        )}
        showsHorizontalScrollIndicator={false}
      />

      {renderOptionGroup('What style is it?', styleOptions, style, setStyle)}
      {renderOptionGroup('When is the best time to wear this outfit?', occasionOptions, occasion, setOccasion)}
      {renderOptionGroup('Select the appropriate season', seasonOptions, season, setSeason)}

      <Text style={styles.sectionTitle}>Post content</Text>
      <TextInput
        placeholder="Write something about this outfit..."
        value={postContent}
        onChangeText={setPostContent}
        multiline
        numberOfLines={4}
        style={styles.postInput}
      />

      {/* <Text style={styles.sectionTitle}>Hashtags</Text>
      <View style={styles.hashtagInputRow}>
        <TextInput
          placeholder="Add hashtags"
          value={inputHashtag}
          onChangeText={setInputHashtag}
          onSubmitEditing={handleAddHashtag}
          style={styles.hashtagInput}
        />
      </View> */}
      {/* <View style={styles.hashtagList}>
        {hashtags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text>#{tag}</Text>
            <TouchableOpacity onPress={() => setHashtags(hashtags.filter((t) => t !== tag))}>
              <Ionicons name="close" size={14} />
            </TouchableOpacity>
          </View>
        ))}
      </View> */}

      <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
        <Text style={styles.uploadButtonText}>Upload</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default UploadOutfitScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  imageBox: {
    width: 100,
    height: 120,
    marginRight: 10,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginTop: 20,
  },
  picker: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginTop: 8,
  },
  postInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  hashtagInputRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 10,
  },
  hashtagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 8,
  },
  hashtagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tag: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  uploadButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 20,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  optionItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    margin: 4,
  },
  optionItemSelected: {
    backgroundColor: '#000',
  },
  optionText: {
    color: '#333',
    fontSize: 14,
  },
  optionTextSelected: {
    color: '#fff',
  },
  dropdownArrowWrapper: {
    position: 'absolute',
    right: 0,
    top: 24,
    paddingRight: 10,
  },
  dropdownArrow: {
    fontSize: 14,
    color: '#999',
  },

});
