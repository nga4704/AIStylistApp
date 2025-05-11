import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { REMOVE_BG_API_KEY } from '../api/config';

export const removeBackground = async (imageUri: string): Promise<string> => {
  try {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      formData.append('image_url', imageUri);
    } else {
      const filename = imageUri.split('/').pop() || `photo.jpg`;
      const match = /\.(\w+)$/.exec(filename ?? '');
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('image_file', {
        uri: imageUri,
        name: filename,
        type,
      } as any);
    }

    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Remove.bg error: ${errorData}`);
    }

    const blob = await response.blob();

    if (Platform.OS === 'web') {
      const localUrl = URL.createObjectURL(blob);
      return localUrl;
    } else {
      // Với React Native -> lưu blob thành file tạm
      const fileReaderInstance = new FileReader();

      return new Promise<string>((resolve, reject) => {
        fileReaderInstance.onloadend = async () => {
          const base64data = fileReaderInstance.result;
          const fileUri = FileSystem.cacheDirectory + `removebg-${Date.now()}.png`;

          try {
            await FileSystem.writeAsStringAsync(fileUri, (base64data as string).split(',')[1], {
              encoding: FileSystem.EncodingType.Base64,
            });
            resolve(fileUri);
          } catch (fsError) {
            console.error('FileSystem write error:', fsError);
            reject(fsError);
          }
        };

        fileReaderInstance.onerror = (e) => {
          reject(e);
        };

        fileReaderInstance.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};
