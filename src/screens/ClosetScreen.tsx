import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useWeather } from '../api/useWeather';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db} from '../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { ClothingItem } from '../model/type'
import { getFirebaseAuth } from '../firebase/authProvider';

const Tab = createMaterialTopTabNavigator();

const categories = [
  'All',
  'Tops',
  'Dresses',
  'Pants',
  'Skirts',
  'Outerwear',
  'Shoes',
  'Bags',
  'Headwear',
  'Jewelry',
  'Other Items',
];

const subscribeClothes = (userId: string, callback: (items: ClothingItem[]) => void) => {
  const clothesRef = collection(db, 'clothes');
  const unsubscribe = onSnapshot(clothesRef, (querySnapshot) => {
    const items: ClothingItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Lọc theo userId để chỉ lấy đồ của người dùng hiện tại
      if (data.userId === userId) {
        items.push({
          id: doc.id,
          ...(data as ClothingItem),
        });
      }
    });
    callback(items);
  });

  return unsubscribe;
};;

const formatTimestampToDate = (timestamp: Timestamp | undefined) => {
  if (!timestamp) return '';
  return new Date(timestamp.seconds * 1000).toLocaleDateString();
};

const capitalizeFirstLetter = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const renderChildCategories = (item: ClothingItem) => {
  if (item?.category?.child && Array.isArray(item.category.child)) {
    return item.category.child.map(capitalizeFirstLetter).join(', ');
  }
  return '';
};

const ClosetScreen = () => {
  const { weather, location, forecast } = useWeather();

  const getWeatherDescription = (description: string) => {
    if (description.includes('sun')) return 'Sunny';
    if (description.includes('cloud')) return 'Cloudy';
    if (description.includes('rain')) return 'Rainy';
    if (description.includes('snow')) return 'Snowy';
    return capitalizeFirstLetter(description);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="location-outline" size={20} color="black" />
        <Text style={styles.locationText}>{location}</Text>
      </View>

      {/* Weather Forecast */}
      <View style={styles.weatherForecastContainer}>
        <FlatList
          data={forecast}
          horizontal
          keyExtractor={(item, index) => index.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.weatherCard}>
              {/* Date + Icon */}
              <View style={styles.weatherRow}>
                <Text style={styles.weatherDate}>
                  {new Date(item.dt * 1000).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
                <Image
                  source={{
                    uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
                  }}
                  style={styles.weatherIcon}
                />
              </View>

              {/* Temperature and Description */}
              <View style={styles.weatherRow}>
                <Text style={styles.weatherTemp}>
                  {Math.round(item.main.temp_min)}° / {Math.round(item.main.temp_max)}°
                </Text>
                <Text style={styles.weatherDescription}>
                  {getWeatherDescription(item.weather[0].description.toLowerCase())}
                </Text>
              </View>
            </View>
          )}
        />
      </View>

      {/* Categories */}
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
        {categories.map((category) => (
          <Tab.Screen
            key={category}
            name={category}
            children={() => <ClothingCategory category={category} />}
          />
        ))}
      </Tab.Navigator>
    </View>
  );
};


const ClothingCategory = ({ category }: { category: string }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>(''); // Thêm state cho userId

  useEffect(() => {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid); // Lưu UID người dùng vào state
    }

    const unsubscribe = subscribeClothes(userId, (clothes) => {
      const filtered = (category === 'All'
        ? clothes
        : clothes.filter(
            (item) =>
              item.category?.parent?.toLowerCase() === category.toLowerCase()
          )
      ).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

      setItems(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [category, userId]); // Gọi lại khi category hoặc userId thay đổi

  if (loading) {
    return <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>;
  }

  return (
    <View style={styles.categoryContainer}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={{ justifyContent: 'flex-start' }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => navigation.navigate('ItemDetailScreen', { item })}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
            <Text style={styles.itemName}>
              {capitalizeFirstLetter(item.name)}
            </Text>
            <Text style={styles.itemDate}>
              {formatTimestampToDate(item.createdAt)}
            </Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        style={styles.addItemButton}
        onPress={() => navigation.navigate('UploadImageScreen')}
      >
        <Text style={styles.addItemText}>Add Items</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  weatherForecastContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  weatherCard: {
    width: 160,
    backgroundColor: '#fff',
    marginRight: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    justifyContent: 'space-between',
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weatherDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#555',
  },
  weatherIcon: {
    width: 30,
    height: 30,
  },
  weatherTemp: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  weatherDescription: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  categoryContainer: {
    flex: 1,
    padding: 16,
  },
  addItemButton: {
    padding: 12,
    backgroundColor: 'black',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  addItemText: {
    color: '#fff',
    fontSize: 16,
  },
  itemContainer: {
    width: '31%',
    marginBottom: 16,
    alignItems: 'center',
    marginRight: '3%',
    backgroundColor: '#fff',  // Add this line to set the background color to white
    borderRadius: 8,  // Optional: if you want rounded corners for the item container
    padding: 6,  // Optional: for inner padding
    shadowColor: 'black', // Optional: if you want some shadow for a more card-like effect
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemName: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  itemDate: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
});

export default ClosetScreen;
