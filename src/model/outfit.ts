import { Timestamp } from 'firebase/firestore';

export type ClothingItem = {
  id: string;
  imageUrl: string;
  name: string;
};

export type Outfit = {
  id: string; // 👈 Thêm id
  imageUrl: string;
  items: ClothingItem[];
  occasion: string;
  style: string;
  temperatureHigh: string;
  temperatureLow: string;
  usedDate: Timestamp | string; // 👈 Có thể là Timestamp hoặc string sau khi format
  createdAt: Timestamp;
  location: string;
  favorite?: boolean; // 👈 Thêm optional favorite
  userID?: string;
};
