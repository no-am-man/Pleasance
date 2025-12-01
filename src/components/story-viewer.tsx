
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, LoaderCircle, Copy, Mic, Square, Info, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VOICES } from "@/config/languages";
import { Label } from "@/components/ui/label";
import { synthesizeSpeech, assessPronunciation as assessPronunciationAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "./ui/separator";

type StoryViewerProps = {
  originalStory: string;
  translatedText: string;
  sourceLanguage: string;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
};

function PronunciationAssessment({ storyText }: { storyText: string }) {
  const [selectedSentence, setSelectedSentence] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  
  const sentenceAudioRef = useRef<HTMLAudioElement>(null);
  const [isSentencePlaying, setIsSentencePlaying] = useState<number | null>(null);

  const sentences = storyText.match(/[^.!?]+[.!?]+/g) || [];

  const handleSentenceSelect = (sentence: string) => {
    setSelectedSentence(sentence);
    setAssessmentResult(null);
  };
  
  const handlePreviewSentence = async (sentence: string, index: number) => {
    if (!sentenceAudioRef.current) return;
    
    // If the same sentence is clicked while playing, pause it.
    if (isSentencePlaying === index && !sentenceAudioRef.current.paused) {
        sentenceAudioRef.current.pause();
        setIsSentencePlaying(null);
        return;
    }

    setIsSentencePlaying(index); // Show loading state

    try {
      const result = await synthesizeSpeech({ text: sentence, voice: VOICES[0].value });
      if (result.error) {
        throw new Error(result.error);
      }
      if (result.audioDataUri) {
        sentenceAudioRef.current.src = result.audioDataUri;
        await sentenceAudioRef.current.play();
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An error occurred';
      toast({ variant: 'destructive', title: 'Could not play audio', description: message });
      setIsSentencePlaying(null);
    }
  };

  useEffect(() => {
    const audio = sentenceAudioRef.current;
    if (!audio) return;
    const onEnded = () => setIsSentencePlaying(null);
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, []);

  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    if (!selectedSentence) {
        toast({
            variant: "destructive",
            title: "No sentence selected",
            description: "Please select a sentence to practice before recording.",
        });
        return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          if (!selectedSentence) return;

          setIsAssessing(true);
          setAssessmentResult(null);
          const result = await assessPronunciationAction({
            audioDataUri: base64Audio,
            text: selectedSentence,
          });
          setIsAssessing(false);

          if (result.error) {
            toast({ variant: 'destructive', title: 'Assessment Failed', description: result.error });
          } else {
            setAssessmentResult(result.assessment!);
          }
        };
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Microphone access denied.' });
    }
  };

  return (
    <Card>
      <audio ref={sentenceAudioRef} className="hidden" />
      <CardHeader>
        <CardTitle>Pronunciation Practice</CardTitle>
        <CardDescription>Select a sentence, record yourself, and get feedback on your pronunciation.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-1 bg-muted/50">
            {sentences.map((sentence, index) => (
               <div key={index} className={`flex items-center gap-2 rounded-md transition-colors pr-2 ${
                  selectedSentence === sentence ? 'bg-primary text-primary-foreground' : ''
                }`}>
                <button
                  onClick={() => handleSentenceSelect(sentence)}
                  className={`flex-grow text-left p-2 rounded-md text-sm ${selectedSentence !== sentence ? 'hover:bg-accent' : ''}`}
                >
                  {sentence}
                </button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0" 
                    onClick={() => handlePreviewSentence(sentence, index)}
                    disabled={isSentencePlaying !== null && isSentencePlaying !== index}
                >
                    {isSentencePlaying === index ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
            <Button
            onClick={handleRecord}
            disabled={isAssessing}
            size="lg"
            className="rounded-full w-16 h-16 shadow-lg"
            >
            {isRecording ? <Square /> : <Mic />}
            </Button>
            <p className="text-sm text-muted-foreground">
            {isRecording ? "Recording... Click to stop." : "Click to record."}
            </p>
        </div>
        
        {isAssessing && (
          <div className="flex items-center justify-center gap-2 p-4 text-primary">
            <LoaderCircle className="animate-spin" />
            <p>Assessing your pronunciation...</p>
          </div>
        )}

        {assessmentResult && (
          <Alert className="animate-in fade-in-50">
            <Info className="h-4 w-4" />
            <AlertTitle>Assessment Feedback</AlertTitle>
            <AlertDescription>
                <p className="whitespace-pre-wrap">{assessmentResult}</p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}


export default function StoryViewer({
  originalStory,
  translatedText,
  sourceLanguage,
  isLoading,
  setIsLoading,
  setError,
}: StoryViewerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].value);
  const [audioUrl, setAudioUrl] = useState('');
  const { toast } = useToast();

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasAudio = audioUrl && audioUrl.length > 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlaybackEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", handlePlaybackEnded);
    
    return () => {
      audio.removeEventListener("loadeddata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", handlePlaybackEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audioUrl) {
      audio.src = audioUrl;
      audio.load(); // Make sure to load the new source
      audio.play().then(() => setIsPlaying(true)).catch(e => console.error("Autoplay failed", e));
    }
  }, [audioUrl]);


  const handlePlay = async () => {
    setIsLoading(true);
    setError(null);
    setAudioUrl(''); // Reset audio URL to force re-render and re-fetch

    const result = await synthesizeSpeech({ text: translatedText, voice: selectedVoice });

    if (result.error) {
        setError(result.error);
    } else if (result.audioDataUri) {
        setAudioUrl(result.audioDataUri);
    }
    setIsLoading(false);
  }

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!hasAudio) {
      handlePlay();
      return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
        if (audio.currentTime >= audio.duration) {
            audio.currentTime = 0; 
        }
        audio.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `The ${type} story has been copied.`,
    });
  };

  return (
    <div className="animate-in fade-in-50 duration-500 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="flex flex-row justify-between items-start">
            <CardTitle>Original Story ({sourceLanguage})</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => handleCopy(originalStory, 'original')}>
                <Copy className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {originalStory}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row justify-between items-start">
            <CardTitle>Translated Story</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => handleCopy(translatedText, 'translated')}>
                <Copy className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="relative isolate">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {translatedText}
                </p>
                {hasAudio && (
                    <div
                    className="absolute inset-0 -z-10 bg-gradient-to-r from-accent/70 to-accent/10 pointer-events-none"
                    style={{
                        width: `${progress}%`,
                        transition: isPlaying ? 'width 0.1s linear' : 'none',
                    }}
                    />
                )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col items-center space-y-4 pt-4">
        <audio ref={audioRef} crossOrigin="anonymous" />
        <div className="w-full max-w-md">
            <Slider
                value={[progress]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                aria-label="Audio progress"
                disabled={!hasAudio || isLoading}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="grid gap-1.5">
                <Label htmlFor="voice-select">Speaker Voice</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isLoading}>
                    <SelectTrigger className="w-[180px]" id="voice-select">
                        <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                        {VOICES.map((voice) => (
                            <SelectItem key={voice.value} value={voice.value}>
                                {voice.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button
            onClick={togglePlayPause}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-16 h-16 shadow-lg self-end"
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={isLoading}
            >
            {isLoading ? (
                <LoaderCircle className="h-8 w-8 animate-spin" />
            ) : isPlaying ? (
                <Pause className="h-8 w-8" />
            ) : (
                <Play className="h-8 w-8 ml-1" />
            )}
            </Button>
        </div>
      </div>
      
      <Separator className="my-8" />
      
      <PronunciationAssessment storyText={translatedText} />
    </div>
  );
}
