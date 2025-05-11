import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, StyleSheet, ScrollView, TextInput } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { db } from '../firebase/config';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const options = {
    season: ['spring', 'summer', 'autumn', 'winter'],
    occasion: ['daily', 'school', 'work', 'party', 'date', 'formal', 'travel', 'wedding', 'beach', 'home', 'sport', 'special', 'etc'],
    color: ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'ivory', 'beige', 'light-gray', 'dark-gray', 'light-yellow', 'orange', 'coral', 'hot-pink', 'light-green', 'sky-blue', 'navy', 'brown', 'dark-brown', 'gold', 'silver', 'purple', 'camel', 'colorful'],
    material: ['denim', 'linen', 'cotton', 'leather', 'wool', 'polyester', 'nylon', 'spandex', 'acrylic', 'silk', 'rayon', 'viscose', 'other material'],
    pattern: ['solid', 'striped', 'plaid', 'polka dot', 'floral', 'checkerboard', 'argyle', 'color-block', 'gingham', 'repeated', 'geometric', 'other pattern'],
    style: ['casual', 'sporty', 'formal', 'vintage', 'streetwear', 'comfortable', 'business casual', 'trendy', 'modern', 'classic', 'minimalist', 'bohemian', 'luxury', 'athleisure', 'affordable', 'premium', 'kidcore', 'basic', 'artics', 'dress-up', 'hipster', 'feminine', 'chic', 'punk', 'kitsch', 'etc'],
    categoryParent: ['dresses', 'tops', 'pants', 'skirts', 'outerwear', 'shoes', 'bags', 'headwear', 'jewelry', 'other'],
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
    gender: ['man', 'woman', 'unisex'],

};

const ItemDetailScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'ItemDetailScreen'>>();
    const navigation = useNavigation();
    const { item } = route.params;

    const [attributes, setAttributes] = useState(item);
    const [expandedFields, setExpandedFields] = useState<{ [key: string]: boolean }>({});
    const [loading, setLoading] = useState(false);

    const toggleSelection = (field: string, value: string) => {
        setAttributes((prev: any) => {
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
            category: { parent, child: [] }, // reset child khi đổi parent
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

    const handleSave = async () => {
        setLoading(true);
        try {
            const itemRef = doc(db, 'clothes', item.id); // nhớ: cần truyền cả id item lúc navigate
            await updateDoc(itemRef, attributes);

            Alert.alert('Success', 'Item updated successfully!');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Confirmation",
            "Are you sure you want to delete this item?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        setLoading(true);
                        try {
                            const itemRef = doc(db, 'clothes', item.id);
                            await deleteDoc(itemRef);

                            Alert.alert('Deleted', 'Item has been deleted.');
                            navigation.goBack();
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        } finally {
                            setLoading(false);
                        }
                    }
                },
            ]
        );
    };


    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} />

            <View style={styles.itemInfo}>
                <TextInput
                    value={attributes.name}
                    onChangeText={(text) => setAttributes({ ...attributes, name: text })}
                    style={styles.itemName}
                />
                <Text style={styles.itemDate}>
                    {attributes.createdAt
                        ? new Date(attributes.createdAt.seconds * 1000).toLocaleDateString()
                        : ''}
                </Text>
            </View>

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
                                {(expandedFields[key] ? options[key] : (Array.isArray(attributes[key]) ? attributes[key] : [])).map((option: string) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.optionButton,
                                            attributes[key]?.includes(option) && styles.optionButtonSelected,
                                        ]}
                                        onPress={() => toggleSelection(key, option)}
                                    >
                                        <Text style={styles.optionText}>{option}</Text>
                                    </TouchableOpacity>
                                ))}
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
                                                    attributes.category.child?.includes(child) && styles.optionButtonSelected
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

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 20 }}>
                    <TouchableOpacity style={[styles.button, { backgroundColor: 'black', flex: 1, marginRight: 5 }]} onPress={handleSave}>
                        <Text style={styles.buttonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, { backgroundColor: 'red', flex: 1, marginLeft: 5 }]} onPress={handleDelete}>
                        <Text style={styles.buttonText}>Delete</Text>
                    </TouchableOpacity>
                </View>


            </View>

            {loading && <ActivityIndicator size="large" color="black" style={{ marginTop: 20 }} />}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, alignItems: 'center', padding: 20 },
    image: { width: 200, height: 220, borderRadius: 10, marginVertical: 20 },
    form: { width: '100%', marginTop: 20 },
    formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, fontWeight: '600' },
    subLabel: { fontSize: 13, marginTop: 5, marginBottom: 3, color: 'gray' },
    optionContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionButton: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, margin: 4 },
    optionButtonSelected: { backgroundColor: 'white', borderColor: 'black' },
    optionText: { color: 'black' },
    expandHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    button: { backgroundColor: 'black', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
    itemInfo: {
        alignItems: 'center',
        marginVertical: 10,
    },
    itemName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#f9f9f9',
        width: '100%',
    },

    itemDate: {
        fontSize: 12,
        color: 'gray',
    },
});

export default ItemDetailScreen;
