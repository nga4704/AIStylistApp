import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const trendingData = [
  {
    id: '1',
    user: 'charlcie',
    caption: 'I fell but i nailed...',
    image: require('../assets/outfit1.jpg'),
    likes: 3,
  },
  {
    id: '2',
    user: 'kim333',
    caption: "Tuesday's OOT...",
    image: require('../assets/outfit2.jpg'),
    likes: 2,
  },
  {
    id: '3',
    user: 'fuchsios',
    caption: '#Reserved #',
    image: require('../assets/outfit3.jpg'),
    likes: 2,
  },
];

export default function HomeScreen() {
  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Image
        source={item.image}
        style={styles.image}
        resizeMode="contain" 
      />
      <View style={styles.info}>
        <Text style={styles.username}>{item.user}</Text>
        <Text style={styles.caption}>{item.caption}</Text>
        <View style={styles.reactions}>
          <Ionicons name="heart-outline" size={16} />
          <Text style={styles.likes}>{item.likes}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>✨ Trending Ideas ✨</Text>
      <FlatList
        data={trendingData}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10, backgroundColor: '#ccc' },
  header: { fontSize: 24, fontWeight: 'bold', paddingLeft: 16, marginBottom: 10 },
  list: { paddingLeft: 20, paddingRight: 20 },
  card: {
    width: '100%', 
    marginBottom: 20, 
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: { 
    width: '100%',  
    height: 400,    
    resizeMode: 'contain', 
  },
  info: { padding: 8 },
  username: { fontWeight: '600' },
  caption: { fontSize: 12, color: '#666', marginVertical: 4 },
  reactions: { flexDirection: 'row', alignItems: 'center' },
  likes: { marginLeft: 4 },
});
