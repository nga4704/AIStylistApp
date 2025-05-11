// types.ts
import { collection, getDocs, Timestamp } from 'firebase/firestore';

export type ClothingItem = {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: Timestamp; 
  category: {
    parent: string;
    child: string[];
  };
  color: string[];
  material: string[];
  occasion: string[];
  pattern: string[];
  season: string[];
  style: string[];
  userId: string;
  embedding?: number[];
  gender: string;
};
  