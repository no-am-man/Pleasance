
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, LoaderCircle, Copy } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VOICES } from "@/config/languages";
import { Label } from "@/components/ui/label";
import { synthesizeSpeech } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

type StoryViewerProps = {
  originalStory: string;
  translatedText: string;
  sourceLanguage: string;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
};

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
    </div>
  );
}
