import axios from 'axios';
import similarity from 'string-similarity';
import { CLARIFAI_API_KEY, GOOGLE_CLOUD_VISION_API_KEY } from './config';

console.log('✅ ai/vision.ts loaded');

// Chuẩn hóa lựa chọn
export const options = {
  season: ['spring', 'summer', 'autumn', 'winter'],
  occasion: ['daily', 'school', 'work', 'party', 'date', 'formal', 'travel', 'wedding', 'beach', 'home', 'sport', 'special', 'etc'],
  color: ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'ivory', 'beige', 'light gray', 'dark gray', 'light yellow', 'orange', 'coral', 'hot pink',
    'light green', 'sky blue', 'navy', 'brown', 'dark-brown', 'gold', 'silver', 'purple', 'camel', 'colorful'],
  material: ['denim', 'linen', 'cotton', 'leather', 'wool', 'polyester', 'nylon', 'spandex', 'acrylic', 'silk', 'rayon', 'viscose', 'other material'],
  pattern: ['solid', 'striped', 'plaid', 'polka dot', 'floral', 'checkerboard', 'argyle', 'color-block', 'gingham', 'repeated', 'geometric', 'other pattern'],
  style: ['casual', 'sporty', 'formal', 'vintage', 'streetwear', 'comfortable', 'business casual', 'trendy', 'modern', 'classic', 'minimalist', 'bohemian',
    'luxury', 'athleisure', 'affordable', 'premium', 'kidcore', 'basic', 'artic', 'dress-up', 'hipster', 'feminine', 'chic', 'punk', 'kitsch', 'etc'],
  gender: ['man', 'woman', 'unisex'],
  categoryParent: ['dresses', 'tops', 'pants', 'skirts', 'outerwear', 'shoes', 'bags', 'headwear', 'jewelry', 'other'],
  categoryChild: {
    dresses: ['mini dress', 'maxi dress', 'tshirt dresses', 'sweater dresses', 'jacket dresses', 'party dresses', 'jumpsuits', 'etc'],
    tops: ['tshirt', 'blouses', 'sweater', 'polo','tee','jersey', 'tanks', 'crop tops', 'shirts', 'hoodies', 'cardigans', 'sports tops', 'bodysuits', 'etc'],
    pants: ['jeans', 'shorts', 'trousers', 'leggings', 'etc'],
    skirts: ['mini skirts', 'midi skirts', 'maxi skirts', 'etc'],
    outerwear: ['jacket', 'coats', 'varsity', 'cardigans', 'vests', 'blazers', 'biker', 'sports jackets', 'bomber', 'etc'],
    shoes: ['sneakers', 'boots', 'heels', 'slip-ons', 'sports shoes', 'sandals', 'slides', 'etc'],
    bags: ['tote', 'crossbody', 'shoulder', 'waist', 'canvas', 'backpacks', 'briefcases', 'suitcases', 'etc'],
    headwear: ['cap', 'hats', 'beanies', 'berets', 'sun hats', 'hijab', 'etc'],
    jewelry: ['earrings', 'necklaces', 'bracelets', 'rings', 'brooches', 'etc'],
  }
};

// Hàm chuyển ảnh URI sang base64
const uriToBase64 = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onerror = reject;
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
};

// Hàm gọi Clarifai API
export const analyzeImageWithClarifai = async (imageUri: string) => {
  console.log('🔎 Analyzing image with Clarifai:', imageUri);

  try {
    const base64 = await uriToBase64(imageUri);

    const response = await axios.post(
      'https://api.clarifai.com/v2/models/general-image-recognition/outputs',
      {
        inputs: [{ data: { image: { base64 } } }],
      },
      {
        headers: {
          Authorization: `Key ${CLARIFAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;
    const labels: string[] = data.outputs?.[0]?.data?.concepts?.map((c: any) => c.name.toLowerCase()) || [];

    return mapLabelsToAttributes(labels);
  } catch (error) {
    console.error('❌ Clarifai Error:', error);
    throw error;
  }
};

// Gọi Google Cloud để nhận màu sắc chiếm ưu thế
const getDominantColorFromGoogleVision = async (imageUri: string): Promise<string> => {
  try {
    const base64 = await uriToBase64(imageUri);

    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        requests: [
          {
            image: { content: base64 },
            features: [{ type: 'IMAGE_PROPERTIES' }],
          },
        ],
      }
    );

    const colors = response.data.responses?.[0]?.imagePropertiesAnnotation?.dominantColors?.colors || [];
    if (colors.length === 0) return '';

    // Lọc các màu có độ sáng trung bình (tránh đen/trắng)
    const filtered = colors.filter((c: any) => {
      const { red, green, blue } = c.color;
      const brightness = (red + green + blue) / 3;
      return brightness > 40 && brightness < 220;
    });

    const bestColor = filtered.length > 0 ? filtered[0].color : colors[0].color;
    const { red, green, blue } = bestColor;
    return rgbToClosestNamedColor(red, green, blue);
  } catch (err) {
    console.error('❌ Google Vision Error:', err);
    return '';
  }
};


// RGB → tên màu gần nhất
const colorMap: { [key: string]: [number, number, number] } = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  red: [255, 0, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  yellow: [255, 255, 0],
  pink: [255, 192, 203],
  purple: [128, 0, 128],
  orange: [255, 165, 0],
  brown: [139, 69, 19],
  gray: [128, 128, 128],
};

const rgbToClosestNamedColor = (r: number, g: number, b: number): string => {
  let closest = '';
  let minDist = Number.MAX_VALUE;

  for (const [name, [cr, cg, cb]] of Object.entries(colorMap)) {
    const dist = Math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2);
    if (dist < minDist) {
      minDist = dist;
      closest = name;
    }
  }
  return closest;
};

// Map labels → attributes
const mapLabelsToAttributes = (labels: string[]) => {
  const lowerLabels = labels.map(l => l.toLowerCase());

  const fuzzyMatch = (labels: string[], options: string[], threshold = 0.7): string[] => {
    return options.filter(option => {
      const best = similarity.findBestMatch(option.toLowerCase(), labels).bestMatch;
      return best.rating >= threshold;
    });
  };

  const season = fuzzyMatch(lowerLabels, options.season);
  const occasion = fuzzyMatch(lowerLabels, options.occasion);
  const material = fuzzyMatch(lowerLabels, options.material);
  const pattern = fuzzyMatch(lowerLabels, options.pattern);
  const style = fuzzyMatch(lowerLabels, options.style);

  let gender: 'man' | 'woman' | 'unisex' = 'unisex';
  if (lowerLabels.includes('man') || lowerLabels.includes('male')) gender = 'man';
  if (lowerLabels.includes('woman') || lowerLabels.includes('female') || lowerLabels.includes('girl')) gender = 'woman';

  let categoryParent = 'tops';
  for (const parent of options.categoryParent) {
    if (lowerLabels.includes(parent)) {
      categoryParent = parent;
      break;
    }
  }

  const childOptions = options.categoryChild[categoryParent as keyof typeof options.categoryChild] || [];
  const categoryChild = fuzzyMatch(lowerLabels, childOptions);

  return {
    season,
    occasion,
    category: {
      parent: categoryParent,
      child: categoryChild,
    },
    material,
    pattern,
    style,
    gender,
    color: []  // để cập nhật sau từ Google
  };
};

// Gộp Clarifai + Google Vision
export const analyzeImageFull = async (imageUri: string) => {
  const attributes = await analyzeImageWithClarifai(imageUri);
  const dominantColor = await getDominantColorFromGoogleVision(imageUri);
  return {
    ...attributes,
    color: dominantColor ? [dominantColor] : attributes.color,
  };
};
