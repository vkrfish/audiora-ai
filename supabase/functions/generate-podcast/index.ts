import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeneratePodcastRequest {
  inputType: 'topic' | 'content' | 'file';
  topic?: string;
  content?: string;
  fileContent?: string;
  outputLanguage: string;
  duration: 'short' | 'medium' | 'long';
  tone: 'educational' | 'conversational' | 'storytelling' | 'professional';
}

interface PodcastScript {
  title: string;
  description: string;
  language: string;
  estimatedDuration: number;
  chapters: {
    title: string;
    content: string;
    durationSeconds: number;
  }[];
  fullScript: string;
  tags: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { inputType, topic, content, fileContent, outputLanguage, duration, tone }: GeneratePodcastRequest = await req.json();

    console.log('Generating podcast:', { inputType, outputLanguage, duration, tone });

    // Determine the source content
    let sourceContent = '';
    if (inputType === 'topic' && topic) {
      sourceContent = `Topic: ${topic}`;
    } else if (inputType === 'content' && content) {
      sourceContent = content;
    } else if (inputType === 'file' && fileContent) {
      sourceContent = fileContent;
    }

    if (!sourceContent) {
      throw new Error('No content provided');
    }

    // Duration mapping
    const durationMinutes = {
      short: 8,
      medium: 18,
      long: 35
    };

    const targetDuration = durationMinutes[duration] || 18;

    // Tone descriptions
    const toneDescriptions = {
      educational: 'informative, structured, and educational with clear explanations',
      conversational: 'casual, engaging, and friendly like a chat between friends',
      storytelling: 'narrative-driven, immersive, and emotionally engaging',
      professional: 'formal, authoritative, and business-like'
    };

    const toneStyle = toneDescriptions[tone] || toneDescriptions.conversational;

    // Language names
    const languageNames: Record<string, string> = {
      en: 'English', es: 'Spanish', fr: 'French', de: 'German',
      pt: 'Portuguese', it: 'Italian', ja: 'Japanese', ko: 'Korean',
      zh: 'Chinese', ar: 'Arabic', hi: 'Hindi', ru: 'Russian'
    };

    const languageName = languageNames[outputLanguage] || 'English';

    const systemPrompt = `You are an expert podcast script writer. Create engaging, well-structured podcast scripts that sound natural when spoken aloud.

Your output must be valid JSON with this exact structure:
{
  "title": "Catchy podcast title",
  "description": "Brief 1-2 sentence description",
  "language": "${outputLanguage}",
  "estimatedDuration": ${targetDuration * 60},
  "chapters": [
    {
      "title": "Chapter title",
      "content": "The spoken content for this chapter...",
      "durationSeconds": 120
    }
  ],
  "fullScript": "The complete script combining all chapters...",
  "tags": ["tag1", "tag2", "tag3"]
}

Guidelines:
- Write in ${languageName}
- Target duration: approximately ${targetDuration} minutes
- Tone: ${toneStyle}
- Create 3-5 chapters for better organization
- The fullScript should flow naturally as spoken audio
- Include natural transitions between topics
- Add brief pauses indicated by "..." where appropriate
- Make it engaging and listener-friendly`;

    const userPrompt = `Create a podcast script based on the following:

${sourceContent}

Remember to output valid JSON only, no markdown code blocks.`;

    console.log('Calling Gemini API...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: userPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini response received');

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      console.error('No text in Gemini response:', JSON.stringify(data));
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let podcastScript: PodcastScript;
    try {
      // Clean the response - remove any markdown code blocks if present
      let cleanedText = generatedText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.slice(7);
      }
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3);
      }
      podcastScript = JSON.parse(cleanedText.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedText);
      throw new Error('Failed to parse podcast script');
    }

    console.log('Podcast script generated successfully:', podcastScript.title);

    return new Response(JSON.stringify(podcastScript), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-podcast function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
