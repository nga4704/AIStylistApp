// src/api/npl.ts
import { OPENAI_API_KEY } from './config';

type LabelData = {
  season: string[],
  occasion: string[],
  category: {
    parent: string,
    child: string[]
  },
  color: string[],
  material: string[],
  pattern: string[],
  style: string[],
  gender: "man" | "woman" | "unisex"
}

export const analyzeLabelsWithOpenAI = async (labels: LabelData): Promise<LabelData> => {
  try {
    const flattenedLabels = [
      ...labels.season,
      ...labels.occasion,
      labels.category.parent,
      ...labels.category.child,
      ...labels.color,
      ...labels.material,
      ...labels.pattern,
      ...labels.style,
      labels.gender
    ];

    const prompt = `
You are a fashion attribute extractor. Given the following labels: ${flattenedLabels.join(', ')}, 
categorize them into the following fields (you can skip if not found):
- season
- occasion
- color
- material
- pattern
- style
- gender
- category (parent and child)

Return a JSON object with this structure:
{
  season: [],
  occasion: [],
  color: [],
  material: [],
  pattern: [],
  style: [],
  gender: "",
  category: { parent: "", child: [] }
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an AI assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
      
    });

    const json = await response.json();
    if (!json.choices || !json.choices[0]?.message?.content) {
      console.error('Invalid OpenAI response:', JSON.stringify(json, null, 2));
      throw new Error('OpenAI response is invalid or incomplete.');
    }

    const content = json.choices[0].message.content;
    console.log('OpenAI response:', JSON.stringify(json, null, 2));
    return JSON.parse(content);
  } catch (error) {
    console.error('Error analyzing labels:', error);
    throw error;
  }
};
