import { useState, useRef } from "react";
import {
  Mic,
  FileText,
  Upload,
  Globe,
  Clock,
  Sparkles,
  Play,
  Pause,
  Download,
  Share2,
  ChevronRight,
  Check,
  Loader2,
  X,
  FileUp,
  Users
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Waveform from "@/components/audio/Waveform";
import { generatePodcast, generateAudio, readFileContent } from "@/lib/podcast-api";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { savePodcastToSupabase } from "@/lib/podcast-api";

type InputType = "topic" | "content" | "file" | "record";
type GenerationStep = "input" | "options" | "generating" | "review" | "complete";

interface GeneratedPodcast {
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
  audioContent?: string;
  audioMimeType?: string;
}

const Create = () => {
  const { user } = useAuth();
  const [inputType, setInputType] = useState<InputType>("topic");
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [outputLanguage, setOutputLanguage] = useState("en");
  const [podcastType, setPodcastType] = useState<"solo" | "conversation">("solo");
  const [duration, setDuration] = useState<"short" | "medium" | "long">("medium");
  const [tone, setTone] = useState<"educational" | "conversational" | "storytelling" | "professional">("conversational");
  const [voice, setVoice] = useState("en-US-AvaMultilingualNeural");
  const [voice2, setVoice2] = useState("en-US-AndrewMultilingualNeural");
  const [niche, setNiche] = useState("technology");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [step, setStep] = useState<GenerationStep>("input");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [generatedPodcast, setGeneratedPodcast] = useState<GeneratedPodcast | null>(null);
  const [editableScript, setEditableScript] = useState("");

  const audioPlayer = useAudioPlayer();

  const languages = [
    { code: "en", name: "English" },
    { code: "te", name: "Telugu" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "pt", name: "Portuguese" },
    { code: "it", name: "Italian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
    { code: "ru", name: "Russian" },
    { code: "te", name: "Telugu" }
  ];

  const durations = [
    { value: "short" as const, label: "Short", time: "5-10 min" },
    { value: "medium" as const, label: "Medium", time: "15-20 min" },
    { value: "long" as const, label: "Long", time: "30-45 min" },
  ];

  const tones = [
    { value: "educational" as const, label: "Educational", description: "Informative and structured conversation between two experts" },
    { value: "conversational" as const, label: "Conversational", description: "Casual and engaging conversation between two friends" },
    { value: "storytelling" as const, label: "Storytelling", description: "Narrative and immersive conversation between two characters" },
    { value: "professional" as const, label: "Professional", description: "Formal and authoritative conversation between two professionals" },
  ];

  const niches = [
    { id: "technology", name: "Technology" },
    { id: "business", name: "Business" },
    { id: "lifestyle", name: "Lifestyle" },
    { id: "education", name: "Education" },
    { id: "entertainment", name: "Entertainment" },
    { id: "health", name: "Health" },
    { id: "science", name: "Science" },
    { id: "arts", name: "Arts" },
  ];

  const voices = [
    { id: "en-US-AvaMultilingualNeural", name: "Ava (Female, Neutral)", gender: "Female" },
    { id: "en-US-AndrewMultilingualNeural", name: "Andrew (Male, Neutral)", gender: "Male" },
    { id: "en-US-EmmaMultilingualNeural", name: "Emma (Female, Friendly)", gender: "Female" },
    { id: "en-US-BrianMultilingualNeural", name: "Brian (Male, Friendly)", gender: "Male" },
    { id: "te-IN-ShrutiNeural", name: "Shruti (Telugu, Female)", gender: "Female" },
    { id: "te-IN-MohanNeural", name: "Mohan (Telugu, Male)", gender: "Male" },
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);

        // Also load it for preview immediately
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // remove data:audio/webm;base64, prefix
          const base64str = base64data.split(',')[1];
          audioPlayer.loadBase64Audio(base64str, 'audio/webm');
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
      toast.error("Microphone access is required to record audio.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks to release mic
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const canProceed = () => {
    if (inputType === "topic") return topic.trim().length > 10;
    if (inputType === "content") return content.trim().length > 50;
    if (inputType === "file") return uploadedFile !== null;
    if (inputType === "record") return recordedAudio !== null;
    return false;
  };

  const handleNextFromInput = () => {
    if (inputType === "record") {
      // Direct jump to review/complete for recording since there's no script generation
      setGeneratedPodcast({
        title: "My Recorded Podcast",
        description: "A custom personal voice recording.",
        language: outputLanguage,
        estimatedDuration: 0,
        chapters: [],
        fullScript: "Self-recorded audio.",
        tags: [niche]
      });
      setStep("options");
    } else {
      setStep("options");
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const saveToLibrary = async (isPublic = false) => {
    if (!generatedPodcast || !generatedPodcast.audioContent) return;

    setIsSaving(true);
    try {
      const podcastToSave = {
        ...generatedPodcast,
        audioContent: generatedPodcast.audioContent as string,
        audioMimeType: generatedPodcast.audioMimeType as string,
        niche,
        type: inputType === "record" ? "recorded" : "generated"
      };
      await savePodcastToSupabase(podcastToSave, isPublic);
      toast.success(isPublic ? "Shared to Feed successfully!" : "Saved to your library!");
    } catch (error) {
      console.error('Failed to save podcast:', error);
      toast.error("Failed to save podcast to cloud.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    setStep("generating");
    setProgress(0);
    setProgressText("Preparing content...");

    try {
      // Step 1: Prepare content
      setProgress(10);
      setProgressText("Analyzing your content...");

      let fileContent = "";
      if (inputType === "file" && uploadedFile) {
        fileContent = await readFileContent(uploadedFile);
      }

      // Step 2: Generate podcast script
      setProgress(30);
      setProgressText("AI is writing your podcast script...");

      // Pre-generation: Get voice names for character personas
      const selectedVoice = voices.find(v => v.id === voice);
      const selectedVoice2 = voices.find(v => v.id === voice2);

      const podcastScript = await generatePodcast({
        inputType,
        topic,
        content,
        fileContent,
        outputLanguage,
        duration,
        tone,
        podcastType,
        voiceName: selectedVoice?.name.split(' ')[0] || 'Host',
        voice2Name: selectedVoice2?.name.split(' ')[0] || 'Guest'
      });

      setGeneratedPodcast(podcastScript);
      setEditableScript(podcastScript.fullScript);

      setProgress(100);
      setProgressText("Script ready for review!");

      setTimeout(() => setStep("review"), 500);

    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to generate script. Please try again.");
      setStep("options");
    }
  };

  const handleGenerateAudio = async () => {
    if (!generatedPodcast) return;

    setStep("generating");
    setProgress(0);
    setProgressText("Initializing conversion...");

    try {
      setProgress(30);
      setProgressText("Converting script to audio...");

      if (inputType === "record" && recordedAudio) {
        // Bypass TTS generation completely if recording
        const reader = new FileReader();
        reader.readAsDataURL(recordedAudio);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // remove data:audio/webm;base64, prefix
          const base64str = base64data.split(',')[1];
          setGeneratedPodcast({
            ...generatedPodcast,
            audioContent: base64str,
            audioMimeType: 'audio/webm',
          });
          setProgress(100);
          setProgressText("Complete!");
          setTimeout(() => setStep("complete"), 500);
        };
        return;
      }

      // Use the edited script if available, fallback to the original full script
      const finalScript = editableScript || generatedPodcast.fullScript;

      const audioResult = await generateAudio(finalScript, outputLanguage, voice, podcastType === 'conversation' ? voice2 : undefined);

      setProgress(90);
      setProgressText("Finalizing your podcast...");

      setGeneratedPodcast({
        ...generatedPodcast,
        audioContent: audioResult.audioContent,
        audioMimeType: audioResult.mimeType,
      });

      // Load audio into player
      audioPlayer.loadBase64Audio(audioResult.audioContent, audioResult.mimeType);

      setProgress(100);
      setProgressText("Complete!");

      setTimeout(() => setStep("complete"), 500);
    } catch (error) {
      console.error('Audio generation failed:', error);
      toast.error("Audio generation failed, but your script is still ready!");
      setStep("review");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (generatedPodcast?.audioContent && generatedPodcast?.audioMimeType) {
      const link = document.createElement('a');
      link.href = `data:${generatedPodcast.audioMimeType};base64,${generatedPodcast.audioContent}`;
      link.download = `${generatedPodcast.title.replace(/[^a-z0-9]/gi, '_')}.mp3`;
      link.click();
      toast.success("Download started!");
    } else {
      toast.error("No audio available to download");
    }
  };

  const handleShareToFeed = async () => {
    await saveToLibrary(true);
  };

  const renderInputStep = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">
          Create Your Podcast
        </h1>
        <p className="text-muted-foreground">
          Start with a topic, paste content, or upload a document
        </p>
      </div>

      <Tabs value={inputType} onValueChange={(v) => setInputType(v as InputType)} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="topic" className="gap-2">
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Topic</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="file" className="gap-2">
            <FileUp className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="record" className="gap-2">
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Record</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topic" className="space-y-4">
          <div className="glass-card p-6">
            <Label htmlFor="topic" className="text-base font-medium mb-3 block">
              What's your podcast about?
            </Label>
            <Textarea
              id="topic"
              placeholder="e.g., The future of renewable energy and how it will transform our daily lives..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-[120px] bg-secondary/50 border-border resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Minimum 10 characters. Be descriptive for better results.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="glass-card p-6">
            <Label htmlFor="content" className="text-base font-medium mb-3 block">
              Paste your content
            </Label>
            <Textarea
              id="content"
              placeholder="Paste an article, blog post, research paper, or any text you want to turn into a podcast..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] bg-secondary/50 border-border resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Minimum 50 characters. The AI will detect the language automatically.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="file" className="space-y-4">
          <div className="glass-card p-6">
            {!uploadedFile ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-12 cursor-pointer hover:border-primary/50 transition-colors">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <FileUp className="w-8 h-8 text-primary" />
                </div>
                <p className="font-medium mb-1">Drop your file here or click to upload</p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF, DOCX, TXT (max 10MB)
                </p>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileUpload}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={removeFile}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="record" className="space-y-4">
          <div className="glass-card p-6 text-center">
            <Label className="text-base font-medium mb-6 block">
              Record your own voice
            </Label>

            <div className="flex flex-col items-center justify-center gap-6">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="rounded-full w-24 h-24 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                >
                  <Mic className="w-10 h-10 text-white" />
                </Button>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-red-500 animate-pulse font-medium">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    Recording...
                  </div>
                  <Button
                    onClick={stopRecording}
                    size="lg"
                    className="rounded-full w-24 h-24 bg-secondary hover:bg-secondary/80 border-4 border-red-500"
                  >
                    <div className="w-8 h-8 bg-red-500 rounded-sm" />
                  </Button>
                </div>
              )}

              {recordedAudio && !isRecording && (
                <div className="w-full mt-6 p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="hero"
                      size="icon"
                      onClick={audioPlayer.toggle}
                    >
                      {audioPlayer.isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 pl-0.5" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <Waveform isPlaying={audioPlayer.isPlaying} barCount={20} className="h-8" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setRecordedAudio(null);
                      audioPlayer.pause();
                    }}>
                      <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              Skip text generation and use your directly recorded audio for the podcast.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button
          variant="hero"
          size="lg"
          disabled={!canProceed()}
          onClick={handleNextFromInput}
          className="gap-2"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  const renderOptionsStep = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
          Customize Your Podcast
        </h2>
        <p className="text-muted-foreground">
          Select language, duration, and tone
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Niche/Category */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <Label className="text-base font-medium">Topic Niche</Label>
          </div>
          <Select value={niche} onValueChange={setNiche}>
            <SelectTrigger className="bg-secondary/50">
              <SelectValue placeholder="Select primary category" />
            </SelectTrigger>
            <SelectContent>
              {niches.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <Label className="text-base font-medium">Output Language</Label>
          </div>
          <Select value={outputLanguage} onValueChange={setOutputLanguage}>
            <SelectTrigger className="bg-secondary/50">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Communication Style */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <Label className="text-base font-medium">Communication Style</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPodcastType("solo")}
              className={cn(
                "p-3 rounded-lg border transition-all text-sm font-medium",
                podcastType === "solo"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/30 hover:bg-secondary/50"
              )}
            >
              One-way (Solo)
            </button>
            <button
              onClick={() => setPodcastType("conversation")}
              className={cn(
                "p-3 rounded-lg border transition-all text-sm font-medium",
                podcastType === "conversation"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/30 hover:bg-secondary/50"
              )}
            >
              Two-way (Conversation)
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Tone */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <Label className="text-base font-medium">Tone</Label>
          </div>
          <div className="space-y-2">
            {tones.map((t) => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  tone === t.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/30 hover:bg-secondary/50"
                )}
              >
                <span className="font-medium block">{t.label}</span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Voice Selection */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="w-5 h-5 text-primary" />
            <Label className="text-base font-medium">Voice AI</Label>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">{podcastType === 'conversation' ? 'Primary Speaker Voice' : 'Voice Selection'}</Label>
              <div className="space-y-2">
                {voices.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVoice(v.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                      voice === v.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/30 hover:bg-secondary/50"
                    )}
                  >
                    <div className="text-left w-full">
                      <span className="font-medium block text-sm">{v.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {podcastType === 'conversation' && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Secondary Speaker Voice</Label>
                <div className="space-y-2">
                  {voices.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVoice2(v.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                        voice2 === v.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary/30 hover:bg-secondary/50"
                      )}
                    >
                      <div className="text-left w-full">
                        <span className="font-medium block text-sm">{v.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {inputType === "record" && (
            <p className="text-xs text-muted-foreground mt-4 italic text-center">
              Voice AI is ignored if you're using your own recorded voice.
            </p>
          )}
        </div>

        {/* Duration */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <Label className="text-base font-medium">Duration</Label>
          </div>
          <div className="space-y-2">
            {durations.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                  duration === d.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/30 hover:bg-secondary/50"
                )}
              >
                <span className="font-medium">{d.label}</span>
                <span className="text-sm text-muted-foreground">{d.time}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep("input")}>
          Back
        </Button>
        <Button variant="hero" size="lg" onClick={inputType === "record" ? handleGenerateAudio : handleGenerate} className="gap-2">
          {inputType === "record" ? <Mic className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          {inputType === "record" ? "Finalize Podcast" : "Generate Podcast"}
        </Button>
      </div>
    </div >
  );

  const renderGeneratingStep = () => (
    <div className="animate-fade-in text-center py-12">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
      <h2 className="font-display text-2xl font-bold mb-3">
        Creating Your Podcast
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        {progressText}
      </p>

      <div className="max-w-md mx-auto mb-4">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{Math.round(progress)}% complete</p>

      <div className="flex justify-center mt-8">
        <Waveform isPlaying barCount={15} className="h-12" />
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-bold mb-2">
          Review Your Script
        </h2>
        <p className="text-muted-foreground">
          Check the generated content before converting to audio
        </p>
      </div>

      <div className="glass-card p-6 mb-8 max-h-[500px] overflow-y-auto">
        <h3 className="font-display text-xl font-bold mb-4">{generatedPodcast?.title}</h3>
        <p className="text-muted-foreground mb-6 italic">{generatedPodcast?.description}</p>

        <div className="space-y-4">
          <Label className="text-base font-medium">Editable Script</Label>
          <Textarea
            value={editableScript}
            onChange={(e) => setEditableScript(e.target.value)}
            className="min-h-[300px] bg-secondary/50 border-border text-sm leading-relaxed"
            placeholder="Edit your script here..."
          />
          <p className="text-xs text-muted-foreground">
            You can make any final adjustments to the text before we convert it to high-quality audio.
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep("options")}>
          Edit Options
        </Button>
        <Button variant="hero" size="lg" onClick={handleGenerateAudio} className="gap-2">
          <Mic className="w-4 h-4" />
          Create Podcast Audio
        </Button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">
          Podcast Ready!
        </h2>
        <p className="text-muted-foreground">
          Your podcast has been generated successfully
        </p>
      </div>

      <div className="glass-card p-6 mb-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
            <Mic className="w-10 h-10 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <Badge className="mb-2">AI Generated</Badge>
            <h3 className="font-display text-xl font-bold mb-1">
              {generatedPodcast?.title || "Your Podcast"}
            </h3>
            <p className="text-muted-foreground mb-2 line-clamp-2">
              {generatedPodcast?.description || ""}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {generatedPodcast ? formatDuration(generatedPodcast.estimatedDuration) : "0:00"}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                {languages.find(l => l.code === generatedPodcast?.language)?.name || "English"}
              </span>
            </div>
          </div>
        </div>

        {/* Audio Player */}
        <div className="bg-secondary/50 rounded-xl p-4">
          <div className="flex items-center gap-4 mb-3">
            <Button
              variant="hero"
              size="icon-lg"
              onClick={audioPlayer.toggle}
              disabled={!generatedPodcast?.audioContent}
            >
              {audioPlayer.isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
            <div className="flex-1">
              <Waveform isPlaying={audioPlayer.isPlaying} barCount={30} className="h-10" />
            </div>
            <span className="text-sm text-muted-foreground">
              {audioPlayer.formatTime(audioPlayer.currentTime)} / {audioPlayer.formatTime(audioPlayer.duration) || formatDuration(generatedPodcast?.estimatedDuration || 0)}
            </span>
          </div>
          {!generatedPodcast?.audioContent && (
            <p className="text-sm text-muted-foreground text-center">
              Audio generation unavailable - script is ready below
            </p>
          )}
        </div>

        {/* Script Preview */}
        {generatedPodcast?.fullScript && (
          <div className="mt-4">
            <Label className="text-sm font-medium mb-2 block">Script Preview</Label>
            <div className="bg-secondary/30 rounded-lg p-4 max-h-40 overflow-y-auto">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {generatedPodcast.fullScript.substring(0, 500)}...
              </p>
            </div>
          </div>
        )}

        {/* Tags */}
        {generatedPodcast?.tags && generatedPodcast.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {generatedPodcast.tags.map((tag, i) => (
              <Badge key={i} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="hero"
          size="lg"
          className="flex-1 gap-2"
          onClick={handleDownload}
          disabled={!generatedPodcast?.audioContent}
        >
          <Download className="w-4 h-4" />
          Download Audio
        </Button>
        <Button
          variant="glass"
          size="lg"
          className="flex-1 gap-2"
          onClick={handleShareToFeed}
          disabled={isSaving}
        >
          <Share2 className="w-4 h-4" />
          {isSaving ? "Sharing..." : "Share to Feed"}
        </Button>
      </div>

      <div className="text-center mt-8">
        <Button
          variant="ghost"
          onClick={() => {
            setStep("input");
            setTopic("");
            setContent("");
            setUploadedFile(null);
            setProgress(0);
            setGeneratedPodcast(null);
          }}
        >
          Create Another Podcast
        </Button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {["input", "options", "generating", "review", "complete"].map((s, i) => {
            const steps = ["input", "options", "generating", "review", "complete"];
            const currentIndex = steps.indexOf(step);
            const stepIndex = i;
            const isActive = stepIndex <= currentIndex;
            const isCurrent = s === step;

            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                    isCurrent && "ring-2 ring-primary/50"
                  )}
                >
                  {stepIndex < currentIndex ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 4 && (
                  <div
                    className={cn(
                      "w-12 h-0.5 rounded",
                      stepIndex < currentIndex ? "bg-primary" : "bg-secondary"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        {step === "input" && renderInputStep()}
        {step === "options" && renderOptionsStep()}
        {step === "generating" && renderGeneratingStep()}
        {step === "review" && renderReviewStep()}
        {step === "complete" && renderCompleteStep()}
      </div>
    </Layout>
  );
};

export default Create;
