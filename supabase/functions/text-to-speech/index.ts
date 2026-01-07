import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TTSRequest {
  text: string;
  language?: string;
  voice?: string;
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

    const { text, language = 'en', voice = 'Kore' }: TTSRequest = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    console.log('Generating TTS audio for text length:', text.length);

    // Use Gemini's TTS capability
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text }]
          }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice
                }
              }
            }
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini TTS API error:', response.status, errorText);
      
      // If TTS fails, return a fallback response
      // In production, you might want to use another TTS service as fallback
      return new Response(
        JSON.stringify({ 
          error: 'TTS generation failed',
          message: 'Audio generation is temporarily unavailable. Please try again later.',
          fallback: true
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('Gemini TTS response received');

    // Extract the audio data
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    
    if (!audioData) {
      console.error('No audio in response:', JSON.stringify(data));
      throw new Error('No audio generated');
    }

    // Return base64 audio data
    return new Response(
      JSON.stringify({ 
        audioContent: audioData.data,
        mimeType: audioData.mimeType || 'audio/mp3'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in text-to-speech function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
