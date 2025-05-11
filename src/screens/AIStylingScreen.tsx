import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Image, Dimensions, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { db} from '../firebase/config';
import { collection, getDocs, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, Timestamp,where  } from 'firebase/firestore';
import { format } from 'date-fns';
import { Outfit } from '../model/outfit';
import { Alert } from 'react-native'; 
import { getFirebaseAuth } from '../firebase/authProvider';

const { width } = Dimensions.get('window');

// interface Outfit {
//   id: string;
//   imageUrl: string;
//   usedDate: string;
//   occasion: string;
//   temperatureLow: number;
//   temperatureHigh: number;
//   where: string;
//   favorite?: boolean;
// }

const AIStylingScreen = () => {
  const [loading, setLoading] = useState(true);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [todayLooks, setTodayLooks] = useState<Outfit[]>([]);
  const [history, setHistory] = useState<Record<string, Record<string, Outfit[]>>>({});
  const [showOccasionModal, setShowOccasionModal] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  // const occasionList = ["Daily 👕", "School 🏫", "Work 📂", "Travel ✈️", "Party 🎈", "Date ❤️", "Wedding 💍", "Other"];
    const occasionList = ["Daily", "School", "Work", "Travel", "Party", "Date", "Wedding", "Other"];
  const [selectedImage, setSelectedImage] = useState<string | null>(null);


  useEffect(() => {
    const unsubscribe = fetchOutfits(); // lưu hàm unsubscribe

    return () => {
      unsubscribe(); // cleanup listener khi component bị unmount
    };
  }, []);


  const fetchOutfits = () => {
    const auth = getFirebaseAuth();

    const user = auth.currentUser;
    const currentUserId = user ? user.uid : null;
    console.log("Current user:", user);
    const userId = currentUserId;

    const q = query(
      collection(db, 'outfits'),
      where('userId', '==', userId),  // Lọc theo userId
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOutfits: Outfit[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data();
        fetchedOutfits.push({
          id: doc.id,
          imageUrl: data.imageUrl,
          usedDate: data.usedDate?.toDate ? format(data.usedDate.toDate(), 'dd/MM/yyyy') : data.usedDate,
          occasion: data.occasion,
          temperatureLow: data.temperatureLow,
          temperatureHigh: data.temperatureHigh,
          location: data.where ?? '',
          favorite: data.favorite ?? false,
          createdAt: data.createdAt,
          items: data.items ?? [],
          style: data.style ?? '',
          userID: data.userId, // 👈 thêm dòng này
        });
        
      });

      setOutfits(fetchedOutfits);
      filterTodaysLook(fetchedOutfits);
      groupHistory(fetchedOutfits);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching outfits:', error);
      setLoading(false);
    });

    return unsubscribe; // trả về để unsubscribe khi unmount
  };

  const filterTodaysLook = (outfits: Outfit[]) => {
    const today = format(new Date(), 'dd/MM/yyyy');
    const todayOutfits = outfits.filter(outfit =>
      outfit.usedDate === today && outfit.occasion === "Daily" // ✅ đúng y điều kiện bạn yêu cầu
    );
    setTodayLooks(todayOutfits);
  };

  const groupHistory = (outfits: Outfit[]) => {
    const historyData: Record<string, Record<string, Outfit[]>> = {};
    const today = format(new Date(), 'dd/MM/yyyy');

    outfits.forEach(outfit => {
      // Skip today's looks from the history
      if (outfit.usedDate === today && outfit.occasion === "Daily") return;

      const occasion = outfit.occasion;
      const usedDateStr = typeof outfit.usedDate === 'string'
        ? outfit.usedDate
        : format((outfit.usedDate as Timestamp).toDate(), 'dd/MM/yyyy');

      if (!historyData[occasion]) {
        historyData[occasion] = {};
      }
      if (!historyData[occasion][usedDateStr]) {
        historyData[occasion][usedDateStr] = [];
      }
      historyData[occasion][usedDateStr].push(outfit);
    });

    setHistory(historyData);
  };


  const handleOccasionSelect = (occasion: string) => {
    setShowOccasionModal(false);
    navigation.navigate('OccasionDetailScreen', { selectedOccasion: occasion });
  };
  const deleteOutfit = async (outfitId: string) => {
    try {
      await deleteDoc(doc(db, 'outfits', outfitId));
      console.log('Outfit deleted successfully');
    } catch (error) {
      console.error('Error deleting outfit:', error);
    }
  };
  const toggleFavorite = async (outfitId: string, currentFavorite: boolean) => {
    try {
      const outfitRef = doc(db, 'outfits', outfitId);
      await updateDoc(outfitRef, {
        favorite: !currentFavorite,
      });
      console.log('Favorite status updated');
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };
  const checkUserItems = async () => {
    const auth = getFirebaseAuth();

    const user = auth.currentUser;
    if (!user) return;
  
    try {
      const q = query(
        collection(db, 'clothes'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const itemCount = querySnapshot.size;
  
      if (itemCount < 10) {
        Alert.alert(
          'Add More Items',
          'You need at least 10 items in your wardrobe to use AI styling.',
          [{ text: 'OK' }]
        );
      } else {
        setShowOccasionModal(true);
      }
    } catch (error) {
      console.error('Error checking item count:', error);
      Alert.alert('Error', 'Failed to check your wardrobe items.');
    }
  };
  
  const renderLookItem = (item: Outfit) => (
    <TouchableOpacity onPress={() => navigation.navigate('OutfitDetailScreen', { outfit: item })}>
      <View style={styles.lookCard}>
        {/* <TouchableOpacity style={styles.deleteButton} onPress={() => deleteOutfit(item.id)}>
          <Ionicons name="trash-outline" size={20} color="gray" />
        </TouchableOpacity> */}

        {/* <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item.id, item.favorite ?? false)}
        >
          <Ionicons
            name={item.favorite ? 'heart' : 'heart-outline'}
            size={20}
            color={item.favorite ? 'red' : 'gray'}
          />
        </TouchableOpacity> */}

        <Image source={{ uri: item.imageUrl }} style={styles.lookImage} resizeMode="cover" />
        {/* <Text style={styles.itemInfoText}></Text> */}
      </View>
    </TouchableOpacity>
  );



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 180 }} style={styles.container}>

        {/* Today's Look */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Look</Text>
          </View>

          <Text style={styles.subText}>Daily 👕  {format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>

          {todayLooks.length > 0 ? (
            <FlatList
              data={todayLooks}
              renderItem={({ item }) => renderLookItem(item)}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.emptyText}>No looks for today 🌻</Text>
          )}
        </View>

        {/* History Section */}
        <View>
          {Object.entries(history).map(([occasion, dates]) => (
            <View key={occasion} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{occasion}</Text>
              </View>

              {Object.entries(dates).map(([date, outfits]) => (
                <View key={date} style={{ marginBottom: 12 }}>
                  <Text style={styles.subText}>{date}</Text>
                  <FlatList
                    data={outfits}
                    renderItem={({ item }) => renderLookItem(item)}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>

      </ScrollView>

      {/* New Styling Button */}
      <View style={styles.bottomArea}>
      <TouchableOpacity style={styles.newStylingButton} onPress={checkUserItems}>
      <Text style={styles.newStylingText}>+ New Styling</Text>
        </TouchableOpacity>
      </View>

      {/* Occasion Modal */}
      <Modal visible={showOccasionModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>What occasion are you styling for?</Text>
            <View style={styles.buttonGrid}>
              {occasionList.map(item => (
                <TouchableOpacity key={item} style={styles.occasionButton} onPress={() => handleOccasionSelect(item)}>
                  <Text style={styles.occasionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={() => setShowOccasionModal(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AIStylingScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    // marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subText: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 8,
  },
  lookCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
    marginRight: 12,
    width: 120,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  lookImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  itemInfoText: {
    fontSize: 12,
    color: 'gray',
    textAlign: 'center',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    marginTop: 8,
  },
  bottomArea: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newStylingButton: {
    backgroundColor: 'black',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 5,
  },
  newStylingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  occasionButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
  },
  occasionText: {
    fontSize: 14,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: 'black',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 4,
    zIndex: 1,
  },
  favoriteButton: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 4,
    zIndex: 1,
  },

});
