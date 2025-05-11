// src/api/vision.ts
import axios from 'axios';
import { CLARIFAI_API_KEY } from './config';
import similarity from 'string-similarity';


console.log('✅ ai/vision.ts loaded');

// Các lựa chọn chuẩn hóa
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

// Hàm gọi Clarifai API
export const analyzeImageWithClarifai = async (imageUri: string) => {
  console.log('🔎 Analyzing real image with Clarifai API:', imageUri);

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
    console.log('🧠 Clarifai API result:', JSON.stringify(data, null, 2));

    const labels: string[] = data.outputs[0]?.data?.concepts?.map((concept: any) => concept.name.toLowerCase()) || [];
    
    // Ánh xạ nhãn thành thuộc tính
    const attributes = mapLabelsToAttributes(labels);
    return attributes;
  } catch (error) {
    console.error('❌ Error analyzing image:', error);
    throw error;
  }
};

// Chuyển URI ảnh thành base64
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

// Map labels -> attributes tự động dựa trên options
const mapLabelsToAttributes = (labels: string[]) => {
    const lowerLabels = labels.map(label => label.toLowerCase());
  
    // Tạo hàm lọc các nhãn trùng với options
    const matchOptions = (list: string[]) => list.filter(option => lowerLabels.includes(option));
    const fuzzyMatch = (labels: string[], options: string[], threshold = 0.7): string[] => {
      return options.filter(option => {
        const best = similarity.findBestMatch(option.toLowerCase(), labels).bestMatch;
        return best.rating >= threshold;
      });
    };
    // Cập nhật các danh mục nhãn (mùa, dịp, màu sắc, chất liệu, v.v.)
    // const season = matchOptions(options.season);
    // const occasion = matchOptions(options.occasion);
    // const color = matchOptions(options.color);
    // const material = matchOptions(options.material);
    // const pattern = matchOptions(options.pattern);
    // const style = matchOptions(options.style);
    const season = fuzzyMatch(lowerLabels, options.season);
  const occasion = fuzzyMatch(lowerLabels, options.occasion);
  const color = fuzzyMatch(lowerLabels, options.color);
  const material = fuzzyMatch(lowerLabels, options.material);
  const pattern = fuzzyMatch(lowerLabels, options.pattern);
  const style = fuzzyMatch(lowerLabels, options.style);
  
    // Giới hạn về giới tính (gender) dựa trên nhãn nhận được
    let gender: 'man' | 'woman' | 'unisex' = 'unisex';
if (lowerLabels.includes('man') || lowerLabels.includes('male')) gender = 'man';
if (lowerLabels.includes('woman') || lowerLabels.includes('female') || lowerLabels.includes('girl')) gender = 'woman';

    // Lọc nhãn để xác định categoryParent
    let categoryParent = 'tops'; // Default cho an toàn
    for (const parent of options.categoryParent) {
      if (lowerLabels.includes(parent)) {
        categoryParent = parent;
        break;
      }
    }
  
    // Cập nhật danh sách categoryChild dựa trên categoryParent
    // const categoryChild = matchOptions(options.categoryChild[categoryParent as keyof typeof options.categoryChild] || []);
    const childOptions = options.categoryChild[categoryParent as keyof typeof options.categoryChild] || [];
    const categoryChild = fuzzyMatch(lowerLabels, childOptions);
    // Trả về đối tượng kết quả với tất cả nhãn được ánh xạ
    return {
      season,
      occasion,
      category: {
        parent: categoryParent,
        child: categoryChild
      },
      color,
      material,
      pattern,
      style,
      gender
    };
  };
  
