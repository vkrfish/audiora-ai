import { supabase } from '@/lib/supabase';

interface GeneratePodcastParams {
  inputType: 'topic' | 'content' | 'file' | 'record';
  topic?: string;
  content?: string;
  fileContent?: string;
  outputLanguage: string;
  duration: 'short' | 'medium' | 'long';
  tone: 'educational' | 'conversational' | 'storytelling' | 'professional';
  podcastType?: 'solo' | 'conversation';
  voiceName?: string;
  voice2Name?: string;
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

export const generatePodcast = async (params: GeneratePodcastParams): Promise<PodcastScript> => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  const {
    inputType, topic, content, fileContent, outputLanguage,
    duration, tone, podcastType = 'solo',
    voiceName = 'Aria', voice2Name = 'Ben'
  } = params;

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
    en: 'English', te: 'Telugu', ta: 'Tamil', es: 'Spanish', fr: 'French', de: 'German',
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
- **STRICT LANGUAGE**: You MUST write the entire script (title, description, chapter titles, and spoken content) in ${languageName} script. Do NOT use English unless it is a technical term that has no equivalent.
- Target duration: approximately ${targetDuration} minutes
- Tone: ${toneStyle}
- Create 3-5 chapters for better organization
- Make it engaging and listener-friendly
${podcastType === 'conversation'
      ? `- FORMAT: This is a TWO-PERSON CONVERSATION. Use "Host:" and "Guest:" labels for speakers.
- CHARACTERS: The Host's name is ${voiceName} and the Guest's name is ${voice2Name}. 
- IMPORTANT: Characters MUST address each other by their names (${voiceName} and ${voice2Name}). 
- DO NOT use placeholders like "[Host's Name]" or "[Guest's Name]". Use the actual names provided.
- Dialogue should be dynamic, with natural interruptions and back-and-forth.`
      : `- FORMAT: This is a SOLO MONOLOGUE performed by ${voiceName}.`}`;

  // Determine the source content
  let sourceContent = '';
  if (inputType === 'topic' && topic) {
    sourceContent = `Topic: ${topic}`;
  } else if (inputType === 'content' && content) {
    sourceContent = content;
  } else if (inputType === 'file' && fileContent) {
    sourceContent = fileContent;
  }

  if (!sourceContent || sourceContent.trim().length < 5) {
    console.error(`[Frontend] Cannot generate podcast. Source content is empty or too short. Type: ${inputType}`);
    throw new Error("No content found to generate a podcast from. Please check your topic, text, or file.");
  }

  const userPrompt = `Create a highly relevant podcast script strictly based on the provided source content. 
Do NOT use generic filler text. If the content is a resume, talk about the professional background and skills.

SOURCE CONTENT:
${sourceContent}

Remember to output valid JSON only, no markdown code blocks.`;

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const payload = JSON.stringify({ systemPrompt, userPrompt });
  console.log(`[Frontend] Sending script generation request. Payload size: ${payload.length} chars`);

  console.log(`[Frontend] Calling script generation at: ${BACKEND_URL}/api/generate-script`);
  const response = await fetch(`${BACKEND_URL}/api/generate-script`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: payload,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`[Frontend] Generation failed with status ${response.status}:`, errorData);
    throw new Error(errorData.error || `Backend error: ${response.status}`);
  }

  return response.json();
};

export const generateAudio = async (text: string, language: string = 'en', voice?: string, voice2?: string): Promise<{ audioContent: string; mimeType: string }> => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${BACKEND_URL}/api/generate-audio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ text, language, voice, voice2 }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Backend error: ${response.status}`);
  }

  return response.json();
};

export const readFileContent = async (file: File): Promise<string> => {
  // For text files, read locally
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || "");
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  // For other files (PDF, DOCX), use the backend parser
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BACKEND_URL}/api/parse-file`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to extract text from ${file.name}`);
  }

  const data = await response.json();
  return data.text;
};

export const uploadImage = async (file: File, userId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/covers/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('podcast-covers')
    .upload(fileName, file, { contentType: file.type });

  if (error) throw new Error(`Failed to upload image: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from('podcast-covers')
    .getPublicUrl(fileName);

  return publicUrl;
};

export const savePodcastToSupabase = async (
  podcast: PodcastScript & {
    audioContent: string;
    audioMimeType: string;
    type?: string;
    niche?: string;
    coverUrl?: string;
    coverFile?: File;
    userCaption?: string;
  },
  isPublic: boolean = false
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in to save podcast");

  let finalCoverUrl = podcast.coverUrl;

  // If a file is provided, upload it first
  if (podcast.coverFile) {
    finalCoverUrl = await uploadImage(podcast.coverFile, user.id);
  }

  // 1. Upload audio to Storage
  // Convert base64 to Blob
  const byteCharacters = atob(podcast.audioContent);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  const blob = new Blob(byteArrays, { type: podcast.audioMimeType });

  const fileExt = podcast.audioMimeType.includes('webm') ? 'webm' : 'mp3';
  const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('audio-files')
    .upload(fileName, blob, { contentType: podcast.audioMimeType });

  if (uploadError) throw new Error(`Failed to upload audio: ${uploadError.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from('audio-files')
    .getPublicUrl(fileName);

  // 2. Insert into podcasts table
  const { data: podcastData, error: podcastError } = await supabase
    .from('podcasts')
    .insert({
      user_id: user.id,
      title: podcast.title,
      description: podcast.description,
      language: podcast.language,
      estimated_duration: podcast.estimatedDuration,
      status: 'completed',
      type: podcast.type || 'generated',
      niche: podcast.niche || podcast.tags?.[0] || 'general',
      is_public: isPublic,
      script_content: podcast.fullScript,
      cover_url: finalCoverUrl,
      user_caption: podcast.userCaption
    })
    .select()
    .single();

  if (podcastError) throw new Error(`Failed to save podcast metadata: ${podcastError.message}`);

  // 3. Insert into audio_files table
  const { error: audioFileError } = await supabase
    .from('audio_files')
    .insert({
      podcast_id: podcastData.id,
      user_id: user.id,
      file_url: publicUrl,
      duration_seconds: podcast.estimatedDuration,
      storage_path: fileName,
      file_size_bytes: blob.size,
      mime_type: podcast.audioMimeType
    });

  if (audioFileError) throw new Error(`Failed to save audio metadata: ${audioFileError.message}`);

  return podcastData;
};

export const getPublicPodcasts = async () => {
  const { data, error } = await supabase
    .from('podcasts')
    .select('*, audio_files(*), profiles(*)')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch public podcasts: ${error.message}`);
  return data;
};

export const updatePodcast = async (
  podcastId: string,
  updates: {
    userCaption?: string;
    coverUrl?: string;
    coverFile?: File;
  }
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in to update podcast");

  let finalUpdates: any = {};

  if (updates.userCaption !== undefined) {
    finalUpdates.user_caption = updates.userCaption;
  }

  if (updates.coverFile) {
    finalUpdates.cover_url = await uploadImage(updates.coverFile, user.id);
  } else if (updates.coverUrl !== undefined) {
    finalUpdates.cover_url = updates.coverUrl;
  }

  if (Object.keys(finalUpdates).length === 0) return { success: true };

  const { data, error } = await supabase
    .from('podcasts')
    .update(finalUpdates)
    .eq('id', podcastId)
    .eq('user_id', user.id) // Security check
    .select()
    .single();

  if (error) throw new Error(`Failed to update podcast: ${error.message}`);
  return data;
};
