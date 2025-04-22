import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { auth, db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useWeather } from '../components/useWeather';

type ClothingItem = {
  id: string;
  imageUrl: string;
  createdAt: string;
  type: string;
  category: string;
  material: string;
  pattern: string;
  occasion: string[];
  color: string[];
  season: string[];
  favorite: boolean;
};

const Tab = createMaterialTopTabNavigator();

const categories = [  'All',  'Tops',  'Dresses',  'Pants',  'Shoes',  'Bags',  'Headwear',  'Jewelry',  'Other Items',];

const ClosetScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { weather } = useWeather();
  const userID = auth.currentUser?.uid;
  
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.weather}>{weather}</Text>
      </View>
      <Tab.Navigator
        screenOptions={{
          tabBarScrollEnabled: true,
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '500',
            textTransform: 'none',
          },
          tabBarItemStyle: {
            width: 'auto',
            paddingHorizontal: 10,
          },
          tabBarIndicatorStyle: {
            backgroundColor: 'black',
            height: 3,
          },
          tabBarStyle: {
            backgroundColor: '#fff',
            elevation: 0,
          },
          tabBarActiveTintColor: 'black',
          tabBarInactiveTintColor: '#888',
        }}
        initialRouteName="All"
      >
        {categories.map((category, index) => (
          <Tab.Screen
            key={category} // Unique key for each tab
            name={category}
            children={() => <ClothingCategory category={category} />}
          />
        ))}
      </Tab.Navigator>
    </View>
  );
};

const ClothingCategory = ({ category }: { category: string }) => {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
  
        const itemsRef = collection(db, 'clothes');
        const q =
          category === 'All'
            ? query(itemsRef, where('userId', '==', userId))
            : query(itemsRef, where('userId', '==', userId), where('type', '==', category.toLowerCase()));
  
        const querySnapshot = await getDocs(q);
  
        const fetchedItems: ClothingItem[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedItems.push({
            id: doc.id,
            imageUrl: data.imageUrl,
            createdAt: data.createdAt?.toDate()?.toLocaleDateString() || '',
            type: data.type,
            category: data.category,
            material: data.material,
            pattern: data.pattern,
            occasion: data.occasion,
            color: data.color,
            season: data.season,
            favorite: data.favorite,
          });
        });
  
        // Nếu không có dữ liệu thật, thêm dữ liệu giả
        if (fetchedItems.length === 0) {
          const mockData: ClothingItem[] = [
            {
              id: '1',
              imageUrl: require('../assets/tshirt.jpg'),
              createdAt: '4/20/2025',
              type: 'tops',
              category: 'T-shirt',
              material: 'Cotton',
              pattern: 'Solid',
              occasion: ['Casual'],
              color: ['White'],
              season: ['Summer'],
              favorite: false,
            },
            {
              id: '2',
              imageUrl: require('../assets/pants.jpg'),
              createdAt: '4/18/2025',
              type: 'pants',
              category: 'Jeans',
              material: 'Denim',
              pattern: 'None',
              occasion: ['Daily'],
              color: ['Blue'],
              season: ['All'],
              favorite: true,
            },
            {
              id: '3',
              imageUrl: require('../assets/sneaker.jpg'),
              createdAt: '4/15/2025',
              type: 'shoes',
              category: 'Sneakers',
              material: 'Leather',
              pattern: 'Color Block',
              occasion: ['Streetwear'],
              color: ['Black', 'White'],
              season: ['Spring'],
              favorite: false,
            },
          ];
          setItems(mockData.filter(item => category === 'All' || item.type === category));
        } else {
          setItems(fetchedItems);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchItems();
  }, [category]);
  

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 20 }} />;
  }

  return (
    <View style={styles.categoryContainer}>
      <TouchableOpacity
        style={styles.addItemButton}
        onPress={() => navigation.navigate('AddItem')}
      >
        <Text style={styles.addItemText}>Add Items</Text>
      </TouchableOpacity>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id} // Ensure 'id' is unique
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Image source={typeof item.imageUrl === 'string' ? { uri: item.imageUrl } : item.imageUrl} style={styles.itemImage} />
            <Text style={styles.itemName}>{item.category}</Text>
            <Text style={styles.itemDate}>{item.createdAt}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  weather: {
    marginTop: 4,
    fontSize: 14,
    color: '#555',
  },
  categoryContainer: {
    flex: 1,
    padding: 16,
  },
  addItemButton: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'black',
    borderRadius: 8,
    alignItems: 'center',
  },
  addItemText: {
    color: '#fff',
    fontSize: 16,
  },
  itemContainer: {
    flex: 1,
    margin: 8,
    alignItems: 'center',
  },
  itemImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
  },
  itemName: {
    marginTop: 8,
    fontSize: 14,
  },
  itemDate: {
    fontSize: 12,
    color: '#888',
  },
});

export default ClosetScreen;
