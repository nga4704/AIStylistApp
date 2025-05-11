import axios from 'axios';
import similarity from 'string-similarity';
import { GOOGLE_CLOUD_VISION_API_KEY } from './config';

console.log('✅ ai/vision_gg_cloud.ts loaded');

export const options = {
  season: ['spring', 'summer', 'autumn', 'winter', 'fall', 'rainy', 'cold', 'hot', 'warm', 'seasonal'],
  occasion: ['daily', 'school', 'work', 'party', 'date', 'formal', 'travel', 'wedding', 'beach', 'home', 'sport', 'special', 'etc', 'birthday', 'office', 'brunch', 'casual'],
  color: ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'ivory', 'beige', 'light gray', 'dark gray', 'light yellow', 'orange', 'coral', 'hot pink', 'light green', 'sky blue', 'navy', 'brown', 'dark-brown', 'gold', 'silver', 'purple', 'camel', 'colorful'],
  material: ['denim', 'linen', 'cotton', 'leather', 'wool', 'polyester', 'nylon', 'spandex', 'acrylic', 'silk', 'rayon', 'viscose', 'other material'],
  pattern: ['solid', 'striped', 'plaid', 'polka dot', 'floral', 'checkerboard', 'argyle', 'color-block', 'gingham', 'repeated', 'geometric', 'other pattern'],
  style: ['casual', 'sporty', 'formal', 'vintage', 'streetwear', 'comfortable', 'business casual', 'trendy', 'modern', 'classic', 'minimalist', 'bohemian', 'luxury', 'athleisure', 'affordable', 'premium', 'kidcore', 'basic', 'artic', 'dress-up', 'hipster', 'feminine', 'chic', 'punk', 'kitsch', 'elegant', 'romantic', 'charming'],
  gender: ['man', 'woman', 'unisex', 'male', 'female', 'gender-neutral', 'masculine', 'feminine'],
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

export const analyzeImageWithGoogleVision = async (imageUri: string) => {
  console.log('🔎 Analyzing real image with Google Vision API:', imageUri);

  try {
    const base64 = await uriToBase64(imageUri);

    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        requests: [
          {
            image: { content: base64 },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 50 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
              { type: 'TEXT_DETECTION', maxResults: 10 },
              { type: 'IMAGE_PROPERTIES', maxResults: 1 },
              { type: 'LOGO_DETECTION', maxResults: 5 }
            ]
          }
        ]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const data = response.data.responses[0] || {};
    const labels = (data.labelAnnotations || [])
      .filter((item: any) => item.score > 0.7)
      .map((item: any) => item.description.toLowerCase());
    const objects = data.localizedObjectAnnotations || [];
    const text = data.textAnnotations || [];
    const imageProperties = data.imagePropertiesAnnotation?.dominantColors?.colors || [];
    const logos = data.logoAnnotations || [];

    return mapLabelsToAttributes(labels, objects, text, imageProperties, logos);
  } catch (error: any) {
    console.error('❌ Error analyzing image with Google Vision:', error.response?.data || error.message);
    throw error;
  }
};

const normalize = (word: string) =>
  word.replace(/[^a-z]/g, '').replace(/s$/, '');

const fuzzyMatch = (labels: string[], options: string[], threshold = 0.8): string[] => {
  const normalizedLabels = labels.map(normalize);
  return options.filter(option => {
    const best = similarity.findBestMatch(option.toLowerCase(), normalizedLabels).bestMatch;
    return best.rating >= threshold;
  });
};

const rgbToClosestColor = (rgb: { red: number, green: number, blue: number }) => {
  const { red, green, blue } = rgb;
  if (red > 200 && green < 100 && blue < 100) return 'red';
  if (red < 100 && green > 200 && blue < 100) return 'green';
  if (red < 100 && green < 100 && blue > 200) return 'blue';
  if (red > 200 && green > 200 && blue < 100) return 'yellow';
  if (red > 200 && green > 200 && blue > 200) return 'white';
  if (red < 50 && green < 50 && blue < 50) return 'black';
  return 'colorful';
};

const synonymMap: Record<string, string[]> = {
  summer: ['hot', 'sunny', 'sleeveless'],
  winter: ['cold', 'snow', 'coat', 'sweater'],
  spring: ['bloom', 'flower', 'fresh'],
  party: ['night out', 'clubbing', 'evening'],
  sport: ['athletic', 'training', 'gym'],
  casual: ['everyday', 'basic', 'normal'],
};

const applySynonymMapping = (combined: string[], resultList: string[], target: string[], label: string) => {
  target.forEach(item => {
    const synonyms = synonymMap[item];
    if (synonyms && synonyms.some(s => combined.includes(s))) {
      resultList.push(item);
    }
  });
};

const mapLabelsToAttributes = (
  labels: string[],
  objects: any[],
  text: any[],
  imageProperties: any[],
  logos: any[]
) => {
  const lowerLabels = labels.map(l => l.toLowerCase());
  const objectLabels = objects.map((o: any) => o.name.toLowerCase());
  const textLabels = text.map((t: any) => t.description.toLowerCase());
  const logoLabels = logos.map((l: any) => l.description.toLowerCase());

  const combined = [...lowerLabels, ...objectLabels, ...textLabels, ...logoLabels];

  const season = fuzzyMatch(combined, options.season, 0.65);
  const occasion = fuzzyMatch(combined, options.occasion, 0.65);
  const material = fuzzyMatch(combined, options.material, 0.8);
  const pattern = fuzzyMatch(combined, options.pattern, 0.7);
  const style = fuzzyMatch(combined, options.style, 0.65);

  applySynonymMapping(combined, season, ['summer', 'winter', 'spring'], 'season');
  applySynonymMapping(combined, occasion, ['party', 'sport'], 'occasion');
  applySynonymMapping(combined, style, ['casual'], 'style');

  let gender: 'man' | 'woman' | 'unisex' = 'unisex';
  if (combined.some(l => ['man', 'male', 'masculine'].includes(l))) gender = 'man';
  if (combined.some(l => ['woman', 'female', 'feminine', 'girl'].includes(l))) gender = 'woman';

  const colorFromLabel = fuzzyMatch(combined, options.color);
  const colorFromRGB = imageProperties.map((c: any) => rgbToClosestColor(c.color));
  const color = Array.from(new Set([...colorFromLabel, ...colorFromRGB]));

  const matchedParent = fuzzyMatch(combined, options.categoryParent, 0.65)[0] || 'tops';
  const childOptions = options.categoryChild[matchedParent as keyof typeof options.categoryChild] || [];
  const matchedChild = fuzzyMatch(combined, childOptions, 0.65);

  return {
    season: Array.from(new Set(season)),
    occasion: Array.from(new Set(occasion)),
    category: {
      parent: matchedParent,
      child: matchedChild
    },
    color,
    material,
    pattern,
    style: Array.from(new Set(style)),
    gender,
  };
};
