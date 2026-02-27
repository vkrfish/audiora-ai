import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  X,
  FileUp,
  Users,
  User,
  MessageSquare,
  Volume2
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Waveform from "@/components/audio/Waveform";
import { generatePodcast, generateAudio, readFileContent } from "@/lib/podcast-api";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { savePodcastToSupabase } from "@/lib/podcast-api";
import { useCreation } from "@/contexts/CreationContext";


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
  const navigate = useNavigate();
  const {
    inputType, setInputType,
    topic, setTopic,
    content, setContent,
    outputLanguage, setOutputLanguage,
    podcastType, setPodcastType,
    duration, setDuration,
    tone, setTone,
    voice, setVoice,
    voice2, setVoice2,
    niche, setNiche,
    step, setStep,
    progress, setProgress,
    progressText, setProgressText,
    generatedPodcast, setGeneratedPodcast,
    editableScript, setEditableScript,
    coverPreview, setCoverPreview,
    resetProgress, prevStep
  } = useCreation();

  const steps: GenerationStep[] = ["input", "options", "generating", "review", "complete"];
  const currentStepIndex = steps.indexOf(step);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [shareCaption, setShareCaption] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioPlayer = useAudioPlayer();
  const [isSaving, setIsSaving] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // Auto-select best voices based on language
  useEffect(() => {
    if (outputLanguage === "te") {
      setVoice("te-IN-ShrutiNeural");
      setVoice2("te-IN-MohanNeural");
    } else if (outputLanguage === "ta") {
      setVoice("ta-IN-PallaviNeural");
      setVoice2("ta-IN-ValluvarNeural");
    } else if (outputLanguage === "hi") {
      setVoice("hi-IN-SwaraNeural");
      setVoice2("hi-IN-MadhurNeural");
    } else if (outputLanguage === "en") {
      setVoice("en-US-AvaMultilingualNeural");
      setVoice2("en-US-AndrewMultilingualNeural");
    } else if (outputLanguage === "fr") {
      setVoice("fr-FR-VivienneMultilingualNeural");
      setVoice2("fr-FR-RemyMultilingualNeural");
    } else if (outputLanguage === "it") {
      setVoice("it-IT-GiuseppeMultilingualNeural");
      setVoice2("en-US-AndrewMultilingualNeural");
    } else if (outputLanguage === "ko") {
      setVoice("ko-KR-HyunsuMultilingualNeural");
      setVoice2("en-US-EmmaMultilingualNeural");
    } else if (outputLanguage === "pt") {
      setVoice("pt-BR-ThalitaMultilingualNeural");
      setVoice2("en-US-AndrewMultilingualNeural");
    }
  }, [outputLanguage]);

  const languages = [
    { code: "en", name: "English" },
    { code: "te", name: "Telugu" },
    { code: "ta", name: "Tamil" },
    { code: "hi", name: "Hindi" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "pt", name: "Portuguese" },
    { code: "it", name: "Italian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "Arabic" },
    { code: "ru", name: "Russian" }
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
    { id: "en-US-AvaMultilingualNeural", name: "Ava (Multilingual, Female)", gender: "Female" },
    { id: "en-US-AndrewMultilingualNeural", name: "Andrew (Multilingual, Male)", gender: "Male" },
    { id: "en-US-EmmaMultilingualNeural", name: "Emma (Multilingual, Female)", gender: "Female" },
    { id: "en-US-BrianMultilingualNeural", name: "Brian (Multilingual, Male)", gender: "Male" },
    { id: "en-AU-WilliamMultilingualNeural", name: "William (Multilingual, Male)", gender: "Male" },
    { id: "fr-FR-RemyMultilingualNeural", name: "Remy (Multilingual, Male)", gender: "Male" },
    { id: "fr-FR-VivienneMultilingualNeural", name: "Vivienne (Multilingual, Female)", gender: "Female" },
    { id: "it-IT-GiuseppeMultilingualNeural", name: "Giuseppe (Multilingual, Male)", gender: "Male" },
    { id: "ko-KR-HyunsuMultilingualNeural", name: "Hyunsu (Multilingual, Male)", gender: "Male" },
    { id: "pt-BR-ThalitaMultilingualNeural", name: "Thalita (Multilingual, Female)", gender: "Female" },
    { id: "en-US-JennyNeural", name: "Jenny (Female, Friendly)", gender: "Female" },
    { id: "en-US-GuyNeural", name: "Guy (Male, Natural)", gender: "Male" },
    { id: "en-US-AriaNeural", name: "Aria (Female, Confident)", gender: "Female" },
    { id: "en-US-ChristopherNeural", name: "Christopher (Male, Professional)", gender: "Male" },
    { id: "te-IN-ShrutiNeural", name: "Shruti (Telugu, Female)", gender: "Female" },
    { id: "te-IN-MohanNeural", name: "Mohan (Telugu, Male)", gender: "Male" },
    { id: "ta-IN-PallaviNeural", name: "Pallavi (Tamil, Female)", gender: "Female" },
    { id: "ta-IN-ValluvarNeural", name: "Valluvar (Tamil, Male)", gender: "Male" },
    { id: "hi-IN-SwaraNeural", name: "Swara (Hindi, Female)", gender: "Female" },
    { id: "hi-IN-MadhurNeural", name: "Madhur (Hindi, Male)", gender: "Male" },
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

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCover = () => {
    setCoverImage(null);
    setCoverPreview(null);
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
      // Direct jump to options for recording
      if (!generatedPodcast) {
        setGeneratedPodcast({
          title: "My Recorded Podcast",
          description: "A custom personal voice recording.",
          language: outputLanguage,
          estimatedDuration: 0,
          chapters: [],
          fullScript: "Self-recorded audio.",
          tags: [niche]
        });
      }
      setStep("options");
    } else {
      setStep("options");
    }
  };

  const saveToLibrary = async (isPublic = false) => {
    if (!generatedPodcast || !generatedPodcast.audioContent) return;

    setIsSaving(true);
    try {
      const podcastToSave = {
        ...generatedPodcast,
        audioContent: generatedPodcast.audioContent as string,
        audioMimeType: generatedPodcast.audioMimeType as string,
        niche,
        type: inputType === "record" ? "recorded" : "generated",
        coverFile: coverImage || undefined,
        userCaption: isPublic ? shareCaption : undefined
      };
      await savePodcastToSupabase(podcastToSave, isPublic);
      toast.success(isPublic ? "Shared to Feed successfully!" : "Saved to your library!");
    } catch (error: any) {
      console.error('Failed to save podcast:', error);
      toast.error(error.message || "Failed to save podcast to cloud.");
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

  const handleShareToFeed = () => {
    setIsShareDialogOpen(true);
  };

  const confirmShareToFeed = async () => {
    setIsShareDialogOpen(false);
    await saveToLibrary(true);
  };

  const renderInputStep = () => (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/feed')}
          className="shrink-0 h-10 w-10 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/40 backdrop-blur-md transition-all active:scale-95 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-left space-y-0.5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Create Your <span className="gradient-text">Podcast</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg leading-relaxed opacity-80">
            Topic, content, or upload. Audiora handles the rest.
          </p>
        </div>
      </div>

      <Tabs value={inputType} onValueChange={(v) => setInputType(v as InputType)} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-transparent h-auto mb-6">
          {[
            { id: 'topic', label: 'Topic', sub: 'AI Generated', icon: Sparkles, color: 'text-cyan-400' },
            { id: 'content', label: 'Content', sub: 'Direct Text', icon: FileText, color: 'text-purple-400' },
            { id: 'file', label: 'Upload', sub: 'PDF / Docs', icon: FileUp, color: 'text-teal-400' },
            { id: 'record', label: 'Record', sub: 'Voice Clone', icon: Mic, color: 'text-red-400' },
          ].map((card) => {
            const Icon = card.icon;
            const active = inputType === card.id;
            return (
              <TabsTrigger
                key={card.id}
                value={card.id}
                className={cn(
                  "group relative flex flex-col items-center gap-3 p-3 rounded-xl border transition-all duration-300 h-full",
                  active
                    ? "bg-primary/5 border-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.1)] ring-1 ring-primary/10"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-500",
                  active ? "bg-primary text-primary-foreground shadow-glow-sm scale-110" : "bg-white/5 text-muted-foreground group-hover:bg-white/10"
                )}>
                  <Icon className={cn("w-5 h-5", active ? "" : card.color)} />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className={cn("font-bold text-xs tracking-tight transition-colors", active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                    {card.label}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-40">
                    {card.sub}
                  </span>
                </div>

                {/* Active Glow behind */}
                {active && (
                  <div className="absolute inset-0 bg-primary/5 blur-lg -z-10 rounded-xl" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="topic" className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="relative group/input">
            {/* Ambient focus glow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 rounded-[2.5rem] blur-2xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-1000" />

            <div className="glass-card relative overflow-hidden rounded-[2rem] border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl transition-all duration-500 group-focus-within/input:border-primary/30 group-focus-within/input:bg-white/[0.04]">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse-slow">
                    <Sparkles className="w-5 h-5 text-primary drop-shadow-glow" />
                  </div>
                  <div className="flex flex-col">
                    <Label htmlFor="topic" className="text-xl font-black tracking-tight text-foreground/90">
                      What's your vision?
                    </Label>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                      AI Powered Strategy
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <Textarea
                    id="topic"
                    placeholder="Describe your podcast idea in detail..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="min-h-[140px] bg-transparent border-none rounded-2xl p-0 text-lg leading-relaxed placeholder:text-muted-foreground/20 resize-none transition-all focus-visible:ring-0 shadow-none scrollbar-hide"
                  />

                  {/* Decorative corner accents */}
                  <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/5 rounded-tr-xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/5 rounded-bl-xl pointer-events-none" />
                </div>

              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="glass-card p-1 gradient-border rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-card/80 backdrop-blur-xl p-5 rounded-[0.9rem]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                  <FileText className="w-3 h-3 text-primary" />
                </div>
                <Label htmlFor="content" className="text-lg font-bold tracking-tight">
                  Paste raw content
                </Label>
              </div>
              <Textarea
                id="content"
                placeholder="Paste an article or blog post..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[160px] bg-secondary/30 border-none rounded-xl p-4 text-base placeholder:text-muted-foreground/40 resize-none transition-all focus-visible:ring-1 focus-visible:ring-primary/20"
              />
              <div className="flex justify-between items-center mt-4 px-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-60">
                  The AI will automatically structure your script
                </p>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold tracking-tighter",
                  content.length > 50 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {content.length} / 50+
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="file" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="glass-card p-1 gradient-border rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-card/80 backdrop-blur-xl p-5 rounded-[0.9rem]">
              {!uploadedFile ? (
                <label className="group flex flex-col items-center justify-center border-2 border-dashed border-border/20 rounded-xl p-8 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-inner">
                    <FileUp className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-lg font-bold mb-1">Drop file here</p>
                  <p className="text-xs text-muted-foreground max-w-[200px] text-center opacity-70">
                    PDF, DOCX, TXT (Max 10MB)
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileUpload}
                  />
                  <div className="mt-8 px-6 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-[0_10px_20px_rgba(var(--primary),0.2)] hover:shadow-[0_15px_25px_rgba(var(--primary),0.3)] transition-all active:scale-95">
                    Browse Files
                  </div>
                </label>
              ) : (
                <div className="flex items-center justify-between p-4 bg-secondary/40 border border-primary/20 rounded-xl animate-in zoom-in-95">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shadow-inner">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-base">{uploadedFile.name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase opacity-60 tracking-wider">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • READY
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    className="h-10 w-10 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="record" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="glass-card p-1 gradient-border rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-card/80 backdrop-blur-xl p-6 text-center rounded-[0.9rem]">
              <div className="flex flex-col items-center justify-center gap-6 py-2">
                {!isRecording ? (
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-red-500/20 rounded-full blur-2xl group-hover:bg-red-500/30 transition-all duration-500" />
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className="relative rounded-full w-20 h-20 bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300 hover:scale-110 active:scale-95 z-10"
                    >
                      <Mic className="w-8 h-8 text-white" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-3 text-red-500 font-bold tracking-widest text-sm uppercase">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                        Live Recording
                      </div>
                      <p className="text-xs text-muted-foreground font-medium opacity-60">Speak clearly for better cloning quality</p>
                    </div>
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      className="rounded-full w-20 h-20 bg-secondary/80 border-4 border-red-500 hover:bg-red-500/10 transition-all duration-300 active:scale-95 group"
                    >
                      <div className="w-8 h-8 bg-red-500 rounded-sm group-hover:scale-90 transition-transform" />
                    </Button>
                  </div>
                )}

                {recordedAudio && !isRecording && (
                  <div className="w-full mt-4 p-6 bg-secondary/30 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-6">
                      <Button
                        variant="hero"
                        size="icon"
                        className="w-14 h-14 rounded-2xl shadow-xl shadow-primary/20"
                        onClick={audioPlayer.toggle}
                      >
                        {audioPlayer.isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6 pl-1" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <Waveform isPlaying={audioPlayer.isPlaying} barCount={40} className="h-12" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={() => {
                          setRecordedAudio(null);
                          audioPlayer.pause();
                        }}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-4 font-medium uppercase tracking-widest opacity-50">
                Voice as source
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col items-center justify-center mt-8 gap-6 pb-20">
        <div className="relative group">
          {/* Subtle background glow */}
          <div className={cn(
            "absolute -inset-2 bg-gradient-to-r from-[#3DDABA] to-[#F19861] rounded-full blur-xl opacity-20 transition-all duration-1000 group-hover:opacity-40",
            !canProceed() && "opacity-0 invisible"
          )}></div>

          <Button
            variant="hero"
            disabled={!canProceed()}
            onClick={handleNextFromInput}
            className="relative h-14 px-10 text-lg font-bold rounded-full gap-3 shadow-xl overflow-hidden transition-all duration-500 hover:scale-102 active:scale-98 disabled:opacity-30 disabled:grayscale group"
          >
            {/* Target Gradient from User Image 3 */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#3DDABA] to-[#F19861] opacity-100 group-hover:brightness-105 transition-all" />

            <span className="relative z-10 flex items-center gap-3 text-black font-semibold">
              Continue
              <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Button>
        </div>

        <div className="flex items-center gap-3 opacity-40 group cursor-default">
          <div className="w-8 h-[1px] bg-foreground/20 transition-all group-hover:w-12" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black">
            Step 1 of 5 • Basic Setup
          </p>
          <div className="w-8 h-[1px] bg-foreground/20 transition-all group-hover:w-12" />
        </div>
      </div>
    </div>
  );

  const renderOptionsStep = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-12">
      <div className="flex items-center gap-6 mb-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevStep}
          className="shrink-0 h-10 w-10 hover:bg-white/5 rounded-xl border border-white/5 backdrop-blur-md transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Button>
        <div className="text-left">
          <h2 className="font-display text-2xl font-black tracking-tighter mb-1">
            <span className="gradient-text text-3xl">Customize</span> Experience
          </h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">
            Define character, tone, and duration
          </p>
        </div>
      </div>

      <div className="space-y-10">
        {/* Core Configuration - Top Section */}
        <div className="grid md:grid-cols-12 gap-8 items-start">
          {/* Interaction Type - The Hero of Step 2 */}
          <div className="md:col-span-12 lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Users className="w-4 h-4 text-primary" />
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Interaction Type</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'solo', label: 'Solo Story', desc: 'Narrative', icon: User },
                { id: 'conversation', label: 'Dynamic Host', desc: 'Natural', icon: MessageSquare },
              ].map((type) => {
                const Icon = type.icon;
                const active = podcastType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setPodcastType(type.id as any)}
                    className={cn(
                      "relative group p-6 rounded-[2rem] border text-left transition-all duration-500 overflow-hidden",
                      active
                        ? "bg-primary/10 border-primary/40 shadow-[0_0_30px_rgba(var(--primary),0.15)] ring-1 ring-primary/20"
                        : "bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-500",
                      active ? "bg-primary text-primary-foreground shadow-glow-sm" : "bg-white/5 text-muted-foreground group-hover:bg-white/10"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={cn("font-bold text-sm tracking-tight", active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                        {type.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 leading-tight">
                        {type.desc}
                      </span>
                    </div>
                    {active && (
                      <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-12 lg:col-span-7 grid sm:grid-cols-2 gap-6">
            {/* Topic Niche */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 px-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Topic Niche</Label>
              </div>
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger className="h-14 bg-white/[0.03] border-white/5 rounded-2xl hover:bg-white/[0.05] hover:border-white/20 px-5 text-sm font-bold transition-all focus:ring-1 focus:ring-primary/40">
                  <SelectValue placeholder="Industry / Niche" />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 border-white/10 backdrop-blur-2xl rounded-2xl p-1 shadow-2xl">
                  {niches.map((n) => (
                    <SelectItem key={n.id} value={n.id} className="rounded-xl py-2.5 px-4 text-xs font-bold focus:bg-primary/10 focus:text-primary cursor-pointer transition-colors">
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 px-1">
                <Globe className="w-4 h-4 text-primary" />
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Output Language</Label>
              </div>
              <Select value={outputLanguage} onValueChange={setOutputLanguage}>
                <SelectTrigger className="h-14 bg-white/[0.03] border-white/5 rounded-2xl hover:bg-white/[0.05] hover:border-white/20 px-5 text-sm font-bold transition-all focus:ring-1 focus:ring-primary/40">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 border-white/10 backdrop-blur-2xl rounded-2xl p-1 shadow-2xl">
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} className="rounded-xl py-2.5 px-4 text-xs font-bold focus:bg-primary/10 focus:text-primary cursor-pointer transition-colors">
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tone & Duration Section */}
        <div className="grid md:grid-cols-12 gap-10 pt-8 border-t border-white/5">
          {/* Tone Grid */}
          <div className="md:col-span-8 lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary" />
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Delivery Tone</Label>
              </div>
              <Badge variant="outline" className="text-[9px] px-2 py-0 uppercase font-black tracking-widest text-primary border-primary/20 bg-primary/5">
                Neural HQ Calibrated
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {tones.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={cn(
                    "group relative p-4 rounded-2xl border text-left transition-all duration-300",
                    tone === t.value
                      ? "bg-primary/10 border-primary/40 shadow-glow-sm"
                      : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                  )}
                >
                  <p className={cn("text-xs font-black tracking-tight mb-1", tone === t.value ? "text-primary" : "text-foreground")}>
                    {t.label}
                  </p>
                  <p className="text-[9px] text-muted-foreground/60 leading-tight line-clamp-2">
                    {t.description}
                  </p>
                  {tone === t.value && (
                    <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-primary shadow-glow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Column */}
          <div className="md:col-span-4 lg:col-span-4 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-4 h-4 text-primary" />
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Target Runtime</Label>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {durations.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group",
                    duration === d.value
                      ? "bg-white/5 border-primary/40 shadow-[inset_0_0_20px_rgba(var(--primary),0.05)]"
                      : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/20"
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className={cn("font-black text-[10px] uppercase tracking-wider", duration === d.value ? "text-primary" : "text-muted-foreground/40")}>
                      {d.label}
                    </span>
                    <span className="text-[11px] font-bold">{d.time} min</span>
                  </div>
                  <div className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-500",
                    duration === d.value ? "border-primary bg-primary" : "border-white/10"
                  )}>
                    {duration === d.value && <Check className="w-2.5 h-2.5 text-primary-foreground stroke-[4]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Voice Selection Centerpiece */}
        <div className="space-y-6 pt-10 border-t border-white/5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-primary" />
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Elite Voices</Label>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Primary Voice Selection */}
            <div className="glass-card p-6 border-white/5 bg-white/[0.01] rounded-[2rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Mic className="w-16 h-16" />
              </div>
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {podcastType === 'conversation' ? 'Primary Speaker' : 'Host Signature'}
              </h4>
              <div className="grid grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2 scrollbar-hide">
                {voices.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVoice(v.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 group",
                      voice === v.id
                        ? "border-primary/40 bg-primary/10 shadow-glow-sm"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-transform duration-500",
                      voice === v.id ? "bg-primary text-primary-foreground scale-110 shadow-glow-sm" : "bg-white/5 text-muted-foreground group-hover:scale-105"
                    )}>
                      {v.name.charAt(0)}
                    </div>
                    <div className="flex flex-col text-left min-w-0">
                      <span className={cn("font-bold text-xs truncate", voice === v.id ? "text-primary" : "text-muted-foreground/80")}>
                        {v.name}
                      </span>
                      <span className="text-[9px] uppercase tracking-tighter opacity-40 font-bold">{v.gender} • Neural</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Guest Voice Selection (Conditional) */}
            {podcastType === 'conversation' ? (
              <div className="glass-card p-6 border-white/5 bg-white/[0.01] rounded-[2rem] relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-700">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Users className="w-16 h-16" />
                </div>
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow-sm" />
                  Guest Interaction
                </h4>
                <div className="grid grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2 scrollbar-hide">
                  {voices.map((v) => (
                    <button
                      key={v.id + "-voice2"}
                      onClick={() => setVoice2(v.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 group",
                        voice2 === v.id
                          ? "border-primary/40 bg-primary/10 shadow-glow-sm"
                          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-transform duration-500",
                        voice2 === v.id ? "bg-primary text-primary-foreground scale-110 shadow-glow-sm" : "bg-white/5 text-muted-foreground group-hover:scale-105"
                      )}>
                        {v.name.charAt(0)}
                      </div>
                      <div className="flex flex-col text-left min-w-0">
                        <span className={cn("font-bold text-xs truncate", voice2 === v.id ? "text-primary" : "text-muted-foreground/80")}>
                          {v.name}
                        </span>
                        <span className="text-[9px] uppercase tracking-tighter opacity-40 font-bold">{v.gender} • Neural</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-6 border border-dashed border-white/5 rounded-[2rem] opacity-20 relative overflow-hidden">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-full bg-white/5 border border-white/5">
                    <User className="w-8 h-8 opacity-40" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest">Solo Mode</p>
                    <p className="text-[10px]">No guest selection required</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {inputType === "record" && (
            <div className="flex items-center justify-center gap-2 py-4 px-6 bg-primary/5 border border-primary/20 rounded-2xl animate-pulse ring-1 ring-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-[10px] text-primary font-black uppercase tracking-widest text-center">
                Custom voice cloning active: Your recorded audio will be used instead.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center mt-6 gap-3">
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-border to-transparent mb-2" />
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#3DDABA] to-[#F19861] rounded-full blur-xl opacity-20 transition-all duration-1000 group-hover:opacity-40"></div>
          <Button
            variant="hero"
            size="lg"
            onClick={inputType === "record" ? handleGenerateAudio : handleGenerate}
            className="relative h-14 px-10 text-lg font-bold rounded-full gap-3 shadow-xl overflow-hidden transition-all duration-500 hover:scale-102 active:scale-98 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#3DDABA] to-[#F19861] opacity-100 group-hover:brightness-105 transition-all" />
            <span className="relative z-10 flex items-center gap-3 text-black font-semibold">
              {inputType === "record" ? "Finalize" : "Continue"}
              <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground max-w-[200px] text-center leading-relaxed opacity-60">
          Powered by Audiora AI Engines.
        </p>
      </div>
    </div>
  );

  const renderGeneratingStep = () => (
    <div className="animate-in fade-in duration-1000 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-[120px] animate-pulse delay-700" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        <div className="relative mb-12">
          {/* Main Visualizer */}
          <div className="w-32 h-32 rounded-full bg-white/[0.01] border border-white/5 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin duration-1000" />
            <div className="absolute inset-4 rounded-full border border-accent/20 border-b-accent animate-spin-reverse duration-700" />
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-glow-sm">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>

          {/* Floating Accents */}
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center animate-bounce duration-[3000ms]">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          </div>
        </div>

        <div className="space-y-2 mb-10">
          <Badge variant="outline" className="px-3 py-0.5 rounded-full bg-primary/5 border-primary/20 text-primary text-[10px] uppercase font-black tracking-widest animate-pulse">
            Neural Engine Active
          </Badge>
          <h2 className="font-display text-3xl font-black tracking-tighter pt-2">
            Synthesizing <span className="gradient-text">Magic</span>
          </h2>
          <p className="text-muted-foreground text-xs font-medium max-w-xs mx-auto opacity-70">
            {progressText}
          </p>
        </div>

        {/* Progress System */}
        <div className="w-full space-y-4 px-8">
          <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-primary rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(var(--primary),0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
              Step {currentStepIndex + 1} of 5
            </span>
            <span className="text-sm font-black text-primary tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Cancel Action */}
        <div className="mt-12 opacity-40 hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevStep}
            className="text-[10px] border border-white/5 hover:bg-white/5 rounded-full px-6 uppercase font-black tracking-widest gap-2"
          >
            <X className="w-3 h-3" />
            Abort Generation
          </Button>
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevStep}
              className="h-8 w-8 hover:bg-white/5 rounded-lg border border-white/5"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Badge variant="outline" className="px-3 py-0 uppercase font-black tracking-widest text-[9px] border-primary/20 bg-primary/5 text-primary">
              Draft Evolution
            </Badge>
          </div>
          <h2 className="font-display text-3xl font-black tracking-tighter">
            Refine <span className="gradient-text">The Script</span>
          </h2>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-40">
            Last chance to tweak before neural conversion
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Characters</span>
              <span className="text-xs font-black tabular-nums">{editableScript?.length || 0}</span>
            </div>
            <div className="w-[1px] h-6 bg-white/5" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Est. Audio</span>
              <span className="text-xs font-black tabular-nums">{Math.ceil((editableScript?.length || 0) / 1000 * 1.5)}m</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Main Editor */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card bg-white/[0.01] border-white/5 rounded-[2.5rem] p-8 relative group">
            <div className="absolute top-6 right-8 opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none">
              <FileText className="w-12 h-12" />
            </div>

            <Textarea
              className="min-h-[500px] w-full bg-transparent border-none focus-visible:ring-0 p-0 text-base leading-relaxed tracking-tight font-medium resize-none scrollbar-hide"
              value={editableScript}
              onChange={(e) => setEditableScript(e.target.value)}
              placeholder="Your AI generated script will appear here..."
            />

            {/* Editor Footer */}
            <div className="absolute bottom-6 right-8 flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Live Neural Sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card bg-white/[0.02] border-white/5 rounded-[2rem] p-6 space-y-6 sticky top-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Magic Actions</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="justify-start gap-4 h-12 rounded-xl border-white/5 bg-white/[0.03] hover:bg-white/5 transition-all text-xs font-bold group">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  Polish Dialogue
                </Button>
                <Button variant="outline" className="justify-start gap-4 h-12 rounded-xl border-white/5 bg-white/[0.03] hover:bg-white/5 transition-all text-xs font-bold group">
                  <div className="p-1.5 rounded-lg bg-accent/10 text-accent group-hover:scale-110 transition-transform">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  Cultural Nuance
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditableScript(generatedPodcast?.fullScript || "")}
                  className="justify-start gap-4 h-12 rounded-xl border-white/5 bg-white/[0.03] hover:bg-white/5 transition-all text-[10px] uppercase font-black tracking-widest text-muted-foreground/60"
                >
                  <Loader2 className="w-3.5 h-3.5" />
                  Reset to Original
                </Button>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-[#3DDABA] to-[#F19861] rounded-full blur-xl opacity-20 transition-all duration-1000 group-hover:opacity-40"></div>
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleGenerateAudio}
                  className="relative w-full h-14 text-lg font-bold rounded-full gap-3 shadow-xl overflow-hidden transition-all duration-500 hover:scale-102 active:scale-98 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#3DDABA] to-[#F19861] opacity-100 group-hover:brightness-105 transition-all" />
                  <span className="relative z-10 flex items-center gap-3 text-black font-semibold">
                    Generate Audio
                    <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Button>
              </div>
              <p className="text-[9px] text-center mt-4 text-muted-foreground font-medium uppercase tracking-[0.2em] opacity-40">
                AI Synthesis will take ~{Math.ceil((editableScript?.length || 0) / 500 * 20)}s
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-10 pb-16">
      <div className="text-center space-y-4 max-w-lg mx-auto">
        <div className="relative inline-block">
          <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-white/[0.01] border border-white/5 flex items-center justify-center backdrop-blur-3xl shadow-glow-sm">
            <Check className="w-12 h-12 text-primary stroke-[3]" />
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-4xl font-black tracking-tighter">
            Masterpiece <span className="gradient-text">Ready</span>
          </h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
            Created with Audiora Neural Pulse
          </p>
        </div>
      </div>

      {/* Main Asset Display */}
      <div className="max-w-3xl mx-auto">
        <div className="glass-card bg-white/[0.01] border-white/5 rounded-[3rem] p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
            <Volume2 className="w-48 h-48" />
          </div>

          <div className="flex flex-col md:flex-row gap-10 items-center">
            {/* Cover Art Section */}
            <div className="relative group/cover shrink-0">
              <div className="absolute -inset-1.5 bg-gradient-to-br from-primary via-accent to-primary rounded-[2.5rem] blur-xl opacity-20 group-hover/cover:opacity-40 transition-opacity" />
              <div
                className={cn(
                  "relative w-48 h-48 rounded-[2rem] bg-secondary/50 border border-white/10 overflow-hidden shadow-2xl cursor-pointer transition-transform duration-700 hover:scale-[1.02]",
                  !coverPreview && "flex items-center justify-center bg-white/[0.02]"
                )}
                onClick={() => coverInputRef.current?.click()}
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="Podcast Cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover/cover:scale-110" />
                ) : (
                  <div className="flex flex-col items-center gap-3 opacity-40">
                    <Upload className="w-8 h-8" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Add Cover</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white translate-y-2 group-hover/cover:translate-y-0 transition-transform">
                    Update Artwork
                  </span>
                </div>
              </div>
            </div>

            {/* Info & Player Section */}
            <div className="flex-1 space-y-6 w-full text-center md:text-left">
              <div className="space-y-2">
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase text-[9px] font-black tracking-widest">
                  {generatedPodcast?.language} • {generatedPodcast?.tags?.[0] || 'Podcast'}
                </Badge>
                <h3 className="font-display text-2xl font-black tracking-tight line-clamp-2">{generatedPodcast?.title}</h3>
                <p className="text-xs text-muted-foreground/60 line-clamp-2 leading-relaxed">{generatedPodcast?.description}</p>
              </div>

              {/* Neural Player Controls */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="hero"
                    size="icon"
                    className="h-12 w-12 rounded-xl shrink-0 shadow-glow-sm"
                    onClick={() => audioPlayer.toggle()}
                  >
                    {audioPlayer.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </Button>
                  <div className="flex-1">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-40 mb-1.5 px-0.5">
                      <span>{audioPlayer.formatTime(audioPlayer.currentTime)}</span>
                      <span>{audioPlayer.formatTime(audioPlayer.duration)}</span>
                    </div>
                    <Waveform isPlaying={audioPlayer.isPlaying} barCount={40} className="h-6 opacity-60" />
                  </div>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="hero" onClick={handleDownload} className="gap-2 rounded-2xl h-14 shadow-lg active:scale-95 transition-all">
                  <Download className="w-4 h-4" />
                  <span className="uppercase text-[10px] font-black tracking-widest">Export HQ</span>
                </Button>
                <Button variant="glass" onClick={handleShareToFeed} className="gap-2 rounded-2xl h-14 border-white/10 active:scale-95 transition-all">
                  <Share2 className="w-4 h-4" />
                  <span className="uppercase text-[10px] font-black tracking-widest">{isSaving ? 'Processing' : 'Share Feed'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <Button variant="ghost" onClick={resetProgress} className="text-[10px] opacity-40 hover:opacity-100 uppercase font-black tracking-widest gap-2 rounded-full border border-white/5 px-8">
          <Loader2 className="w-3 h-3" />
          Create New Episode
        </Button>
        <p className="text-muted-foreground/30 text-[9px] uppercase font-bold tracking-[0.3em]">
          Immutable Content Hash: {Math.random().toString(36).substring(7).toUpperCase()}
        </p>
      </div>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-popover/95 border-white/5 backdrop-blur-3xl rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
          <div className="p-8 space-y-8">
            <div className="text-center space-y-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 uppercase text-[9px] font-black tracking-widest">Community Sync</Badge>
              <h3 className="text-2xl font-black tracking-tighter">Share to <span className="gradient-text">Audiora Feed</span></h3>
              <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">Publish your masterpiece for the Audiora community to discover.</p>
            </div>

            <div className="flex flex-col items-center gap-8">
              {/* Cover Art Preview in Dialog */}
              <div
                className="relative w-40 h-40 rounded-[2rem] bg-secondary/30 border border-white/10 overflow-hidden shadow-xl cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => coverInputRef.current?.click()}
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="Dialog Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 opacity-30">
                    <Upload className="w-6 h-6" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Add Art</span>
                  </div>
                )}
              </div>

              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Creator Note</Label>
                  <Textarea
                    placeholder="Tell the world about your podcast..."
                    className="bg-white/5 border-white/5 rounded-2xl min-h-[120px] focus:ring-primary/40 text-sm leading-relaxed"
                    value={shareCaption}
                    onChange={(e) => setShareCaption(e.target.value)}
                  />
                  <div className="flex justify-end pr-2 text-[9px] font-bold text-muted-foreground/40">{shareCaption.length}/500</div>
                </div>

                <Button variant="hero" className="w-full py-7 rounded-2xl shadow-glow-sm" onClick={confirmShareToFeed} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
                  <span className="font-black text-xs uppercase tracking-widest">{isSaving ? 'Synchronizing...' : 'Publish to Feed'}</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <input
        type="file"
        ref={coverInputRef}
        onChange={handleCoverUpload}
        accept="image/*"
        className="hidden"
      />
    </div>
  );

  const stepLabels: Record<GenerationStep, string> = {
    input: "Start",
    options: "Customize",
    generating: "Creation",
    review: "Refine",
    complete: "Done"
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 max-w-4xl relative overflow-hidden min-h-[calc(100vh-64px)]">
        {/* Decorative Background Elements */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-accent/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Progress Stepper */}
        {(() => {
          const stepsArr: GenerationStep[] = ["input", "options", "generating", "review", "complete"];

          return (
            <div className="relative mb-12 max-w-3xl mx-auto px-12">
              {/* Connector Line Background */}
              <div className="absolute top-4 left-[12%] right-[12%] h-[1px] bg-border/20 z-0" />

              <div className="relative flex justify-between z-10">
                {stepsArr.map((s, i) => {
                  const active = i <= currentStepIndex;
                  const current = s === step;

                  return (
                    <div key={s} className="flex flex-col items-center group">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 relative",
                        active
                          ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)]"
                          : "bg-secondary/80 border border-border/40 backdrop-blur-md text-muted-foreground"
                      )}>
                        {active && i < currentStepIndex ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <span className="text-[11px] font-bold tracking-tighter">{i + 1}</span>
                        )}

                        {/* Pulsing Ring for current step */}
                        {current && (
                          <div className="absolute inset-0 rounded-full animate-ping ring-4 ring-primary/20 opacity-40" />
                        )}
                      </div>

                      {/* Label */}
                      <span className={cn(
                        "mt-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                        active ? "text-primary opacity-100" : "text-muted-foreground opacity-40",
                        current && "drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                      )}>
                        {stepLabels[s as GenerationStep]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Animated Active Line */}
              <div
                className="absolute top-4 left-[12.5%] h-[1px] bg-gradient-to-r from-primary to-accent shadow-[0_0_15px_rgba(var(--primary),0.6)] transition-all duration-1000 ease-in-out z-0"
                style={{ width: `${(currentStepIndex / 4) * 75}%` }}
              />
            </div>
          );
        })()}

        {/* Step Content */}
        <div className="relative z-10 mt-4 transition-all duration-500">
          {step === "input" && renderInputStep()}
          {step === "options" && renderOptionsStep()}
          {step === "generating" && renderGeneratingStep()}
          {step === "review" && renderReviewStep()}
          {step === "complete" && renderCompleteStep()}
        </div>
      </div>
    </Layout>
  );
};

export default Create;
