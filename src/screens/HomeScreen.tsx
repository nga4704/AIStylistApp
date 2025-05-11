import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { query, orderBy } from 'firebase/firestore';

const timeAgo = (timestamp: any) => {
  const date = timestamp.toDate();
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} ngày trước`;
  if (hours > 0) return `${hours} giờ trước`;
  if (minutes > 0) return `${minutes} phút trước`;
  return 'Vừa xong';
};

export default function HomeScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<{ [key: string]: any }>({});
  const [likedPosts, setLikedPosts] = useState<{ [key: string]: boolean }>({}); // theo dõi like
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true); // bắt đầu refresh

      const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const postsSnapshot = await getDocs(postsQuery);      const postsData = postsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          like: typeof data.like === 'number' ? data.like : 0,
        };
      });

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersMap: { [key: string]: any } = {};
      usersSnapshot.docs.forEach(doc => {
        usersMap[doc.id] = doc.data();
      });

      setUsers(usersMap);
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setRefreshing(false); // kết thúc refresh
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLike = async (post: any) => {
    const postId = post.id;
    const alreadyLiked = likedPosts[postId];

    // Nếu đã thích, bỏ thích
    const newLike = alreadyLiked ? (post.like || 0) - 1 : (post.like || 0) + 1;

    try {
      await updateDoc(doc(db, 'posts', postId), {
        like: newLike,
      });

      // Cập nhật local UI
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === postId ? { ...p, like: newLike } : p
        )
      );

      setLikedPosts(prev => ({
        ...prev,
        [postId]: !alreadyLiked,
      }));
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const renderItem = ({ item }: any) => {
    const user = users[item.userId] || {};
    const isLiked = likedPosts[item.id];

    return (
      <View style={styles.card}>
        <View style={styles.topBar}>
          <Image source={{ uri: user.avatarURL }} style={styles.avatar} />
          <Text style={styles.username}>{user.username || item.userId}</Text>
          <TouchableOpacity style={styles.followButton}>
            <Text style={styles.followText}>Follow</Text>
          </TouchableOpacity>
        </View>

        <Image source={{ uri: item.images?.[0] }} style={styles.image} />

        <View style={styles.info}>
          <View style={styles.reactions}>
            <TouchableOpacity onPress={() => handleLike(item)}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={isLiked ? 'red' : 'black'}
              />
            </TouchableOpacity>
            <Text style={styles.likes}>{item.like ?? 0}</Text>

            <Feather name="message-circle" size={20} style={styles.iconSpacing} />
            <Feather name="bookmark" size={20} style={styles.iconSpacing} />
          </View>

          <Text style={styles.caption}>{item.content}</Text>
          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={(item) => item.outfitId || item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={fetchData}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10, backgroundColor: '#fff' },
  list: { paddingBottom: 20 },
  card: {
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: '#eee',
    marginLeft: 10,
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
  },
  followButton: {
    marginLeft: 'auto',
    backgroundColor: 'black',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 20,
  },
  followText: {
    color: '#fff',
    fontSize: 12,
  },
  image: {
    width: '100%',
    height: 320,
    resizeMode: 'contain',
    backgroundColor: '#f2f2f2',
  },
  info: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  caption: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  reactions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  likes: {
    marginLeft: 8,
    fontSize: 13,
  },
  iconSpacing: {
    marginLeft: 12,
  },
  time: {
    color: '#999',
    fontSize: 11,
    marginTop: 6,
  },
  hashtags: {
    color: 'black',
    marginTop: 4,
    fontWeight: '600',
  },
});
