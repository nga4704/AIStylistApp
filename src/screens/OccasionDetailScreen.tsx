// src/screens/OccasionDetailScreen.tsx 
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Image, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getDoc, doc, updateDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useWeather } from '../api/useWeather';
import PagerView from 'react-native-pager-view';
import { RootStackParamList } from '../navigation/AppNavigator';
import { NavigationProp } from '@react-navigation/native';
import { ClothingItem } from '../model/type'
import { getFirebaseAuth } from '../firebase/authProvider';


const bodyTypes = [
    { label: 'Triangle', value: 'Triangle', image: require('../assets/triangle.png') },
    { label: 'Inverted Triangle', value: 'Inverted Triangle', image: require('../assets/inverted_triangle.png') },
    { label: 'Hourglass', value: 'Hourglass', image: require('../assets/hourglass.png') },
    { label: 'Rectangle', value: 'Rectangle', image: require('../assets/rectangle.png') },
    { label: 'Oval', value: 'Oval', image: require('../assets/oval.png') },
];

const personalColors = [
    { label: 'Warm Bright', value: 'Warm Bright', image: require('../assets/warm_bright.png') },
    { label: 'Warm Deep', value: 'Warm Deep', image: require('../assets/warm_deep.png') },
    { label: 'Cool Soft', value: 'Cool Soft', image: require('../assets/cool_soft.png') },
    { label: 'Cool Vivid', value: 'Cool Vivid', image: require('../assets/cool_vivid.png') },
];

const occasionStylesMap: { [key: string]: string[] } = {
    "Daily": ["None", "Casual", "Classic", "Street", "Modern", "Minimal", "Feminine", "Bohemian"],
    "School": ["None", "Casual", "Minimal", "Street", "Classic", "Modern", "Feminine", "Bohemian"],
    "Work": ["None", "Business Casual", "Semi Formal", "Formal"],
    "Travel": ["None", "Casual", "Street", "Bohemian", "Sporty", "Chic", "Minimalist", "Vacation", "Tropical", "Adventure", "Beachwear", "Urban"],
    "Party": ["None", "House Party", "Prom", "Sleepover Party", "Dinner Party", "Costume Party", "Christmas Party", "Swimming pool Party", "New Year Party", "Other"],
    "Date": ["None", "Casual", "Dress-Up", "Romantic", "Elegant", "Flirty", "Chic"],
    "Wedding": ["None", "Casual", "Semi Formal", "Formal", "Bridal", "Glam", "Traditional", "Bohemian"],
    "Other": ["None", "Casual", "Trendy", "Street", "Sporty", "Chic", "Minimalist", "Vintage"],
};

const OccasionDetailScreen = () => {
    const route = useRoute<any>();
    const { selectedOccasion } = route.params;
    const stylesList = occasionStylesMap[selectedOccasion] || [];
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [items, setItems] = useState<any[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    const [userData, setUserData] = useState<any>(null);
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [bodyType, setBodyType] = useState('');
    const [personalColor, setPersonalColor] = useState('');
    const [selectedStyle, setSelectedStyle] = useState<string>('None');
    const [where, setWhere] = useState('');
    const [whenOptions, setWhenOptions] = useState<string[]>([]);
    const [selectedDateIndex, setSelectedDateIndex] = useState(0);
    const [temperatureLow, setTemperatureLow] = useState('');
    const [temperatureHigh, setTemperatureHigh] = useState('');
    const [activeTab, setActiveTab] = useState(0);


    const { location, forecast } = useWeather();
    const auth = getFirebaseAuth();

    const user = auth.currentUser;

    const [allItems, setAllItems] = useState<ClothingItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const fetchUserData = async () => {
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setUserData(data);

                    setHeight(data.height || '');
                    setWeight(data.weight || '');
                    setBodyType(data.bodyType || '');
                    setPersonalColor(data.personalColor || '');

                    if (data.height && data.weight && data.bodyType && data.personalColor) {
                        setActiveTab(2);
                    }
                }
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        if (location) {
            setWhere(location);
        }

        const today = new Date();
        const options: string[] = [];
        for (let i = 0; i < 5; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            options.push(date.toLocaleDateString());
        }
        setWhenOptions(options);
    }, [location]);

    useEffect(() => {
        if (forecast.length > 0 && selectedDateIndex < forecast.length) {
            const selectedForecast = forecast[selectedDateIndex];
            const tempMin = selectedForecast.main.temp_min;
            const tempMax = selectedForecast.main.temp_max;

            setTemperatureLow(tempMin.toFixed(1));
            setTemperatureHigh(tempMax.toFixed(1));
        }
    }, [forecast, selectedDateIndex]);

    const subscribeClothes = (callback: (items: ClothingItem[]) => void) => {
        const clothesRef = collection(db, 'clothes');
        const unsubscribe = onSnapshot(clothesRef, (querySnapshot) => {
            const items: ClothingItem[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                items.push({
                    id: doc.id,
                    ...(data as ClothingItem),
                });
            });
            callback(items);
        });

        return unsubscribe;
    };


    useEffect(() => {
        const unsubscribe = subscribeClothes((clothes) => {
            // Không lọc theo category, chỉ lấy tất cả
            const sorted = clothes.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
            setAllItems(sorted);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSaveProfile = async () => {
        if (!height || !weight || !bodyType || !personalColor) {
            alert('Please fill out all fields!');
            return;
        }

        if (user) {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                height,
                weight,
                bodyType,
                personalColor,
            });
            alert('Profile updated!');
            setActiveTab(1);
        }
    };

    const handleStyleSelect = (style: string) => {
        setSelectedStyle(prev => (prev === style ? 'None' : style));
    };

    // if (loading) {
    //     return <ActivityIndicator size="large" color="black" style={{ flex: 1, justifyContent: 'center' }} />;
    // }
    const toggleItemSelection = (itemId: string) => {
        setSelectedItems((prev) =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedItems([]);
        } else {
            const allIds = allItems.map(item => item.id); // dùng allItems
            setSelectedItems(allIds);
        }
        setSelectAll(!selectAll);
    };


    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{selectedOccasion.replace(/👕|🏫|📂|✈️|🎈|❤️|💍/g, '').trim()}</Text>
                <View style={{ width: 20 }} />
            </View>

            {/* PagerView */}
            <PagerView style={styles.pagerView} initialPage={0} onPageSelected={(e) => setActiveTab(e.nativeEvent.position)}>
                {/* Tab 1 - Profile */}
                <View key="1">
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 16 }}>
                                <Text style={styles.inputLabel}>Height (cm)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Height (cm)"
                                    keyboardType="numeric"
                                    value={height}
                                    onChangeText={setHeight}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Weight (kg)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Weight (kg)"
                                    keyboardType="numeric"
                                    value={weight}
                                    onChangeText={setWeight}
                                />
                            </View>
                        </View>

                        {/* Body Type */}
                        <Text style={styles.inputLabel}>Body Type</Text>
                        <View style={styles.radioGroup}>
                            {bodyTypes.map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    onPress={() => setBodyType(type.value)}
                                    style={[
                                        styles.radioButton,
                                        bodyType === type.value && styles.selectedRadioButton
                                    ]}
                                >
                                    <Image source={type.image} style={styles.radioImage} />
                                    <Text>{type.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Personal Color */}
                        <Text style={styles.inputLabel}>Personal Color</Text>
                        <View style={styles.radioGroup}>
                            {personalColors.map((color) => (
                                <TouchableOpacity
                                    key={color.value}
                                    onPress={() => setPersonalColor(color.value)}
                                    style={[
                                        styles.radioButton,
                                        personalColor === color.value && styles.selectedRadioButton
                                    ]}
                                >
                                    <Image source={color.image} style={styles.radioImage} />
                                    <Text>{color.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.submitButton} onPress={handleSaveProfile}>
                            <Text style={styles.submitButtonText}>Save Change</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Tab 2 - Styling */}
                <View key="2">
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.sectionTitle}>Styling</Text>

                        {/* Style Select */}
                        <View style={styles.styleContainer}>
                            {stylesList.map((style) => (
                                <TouchableOpacity
                                    key={style}
                                    style={[styles.styleTag, selectedStyle === style && styles.selectedStyleTag]}
                                    onPress={() => handleStyleSelect(style)}
                                >
                                    <Text style={styles.styleTagText}>{style}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Where */}
                        <Text style={styles.inputLabel}>Where</Text>
                        <Text style={styles.staticText}>{where || 'Loading...'}</Text>

                        {/* When */}
                        <Text style={styles.inputLabel}>When</Text>
                        <View style={styles.dateList}>
                            {whenOptions.map((date, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dateItem,
                                        selectedDateIndex === index && styles.selectedDateItem
                                    ]}
                                    onPress={() => setSelectedDateIndex(index)}
                                >
                                    <Text style={styles.dateText}>{date}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Temperature */}
                        <Text style={styles.inputLabel}>Temperature</Text>
                        <Text style={styles.staticText}>
                            {temperatureLow && temperatureHigh
                                ? `${temperatureLow}°C ~ ${temperatureHigh}°C`
                                : 'Loading...'}
                        </Text>

                    </ScrollView>
                </View>

                <View key="3">
                    <View style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={styles.scrollContent}>
                            <Text style={styles.sectionTitle}>Select Items</Text>

                            <TouchableOpacity
                                style={[styles.submitButton, { marginBottom: 16 }]}
                                onPress={handleSelectAll}
                            >
                                <Text style={styles.submitButtonText}>{selectAll ? 'Unselect All' : 'Select All'}</Text>
                            </TouchableOpacity>

                            <View style={styles.gridContainer}>
                                {allItems.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => toggleItemSelection(item.id)}
                                        style={[
                                            styles.gridItem,
                                            selectedItems.includes(item.id) && styles.selectedGridItem
                                        ]}
                                    >
                                        <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
                                        <Text style={styles.gridItemName}>{item.name || 'Unnamed'}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.fixedButton}
                            onPress={() => navigation.navigate('SuggestionOutfitScreen', {
                                selectedOccasion,
                                selectedStyle,
                                personalColor,
                                bodyType,
                                temperatureLow,
                                temperatureHigh,
                                selectedWhen: whenOptions[selectedDateIndex],
                                where,
                                selectedItems
                            })}
                        >
                            <Text style={styles.submitButtonText}>Get Suggestions</Text>
                        </TouchableOpacity>
                    </View>

                </View>

            </PagerView>
        </View>
    );
};

export default OccasionDetailScreen;

// Styles
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#eee', marginTop: 20 },
    backText: { fontSize: 30 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    pagerView: { flex: 1 },
    scrollContent: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    row: { flexDirection: 'row', marginBottom: 12 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, fontSize: 14, height: 40, marginBottom: 12 },
    inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
    styleContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
    styleTag: { backgroundColor: '#f5f5f5', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, marginRight: 8, marginBottom: 10 },
    selectedStyleTag: { borderColor: 'black', borderWidth: 1 },
    styleTagText: { fontSize: 14, fontWeight: '500' },
    submitButton: { backgroundColor: 'black', paddingVertical: 12, borderRadius: 20, alignItems: 'center', marginTop: 20 },
    submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    radioGroup: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    radioButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 10, padding: 10, marginRight: 10, marginBottom: 12 },
    selectedRadioButton: { borderColor: 'black', borderWidth: 1 },
    radioImage: { width: 40, height: 40, marginRight: 10 },
    staticText: { fontSize: 16, fontWeight: '500', marginBottom: 12, color: 'gray' },
    dateList: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
    dateItem: { backgroundColor: '#f0f0f0', padding: 8, borderRadius: 10, marginRight: 8, marginBottom: 8 },
    selectedDateItem: { borderColor: 'black', borderWidth: 1 },
    dateText: { color: 'black', fontWeight: '600' },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      },
      gridItem: {
        width: '30%',
        marginBottom: 16,
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 8,
      },
      selectedGridItem: {
        borderWidth: 2,
        borderColor: 'black',
      },
      gridImage: {
        width: '100%',
        height: 80,
        borderRadius: 8,
        marginBottom: 6,
      },
      gridItemName: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
        color: '#333',
      },
      fixedButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'black',
        paddingVertical: 14,
        borderRadius: 24,
        alignItems: 'center',
      },
      

});

