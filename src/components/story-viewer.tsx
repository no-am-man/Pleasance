
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, LoaderCircle, Copy } from "lucide-react";
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
      audio.load();
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.error("Autoplay was prevented.", e);
        setIsPlaying(false); // Update state to reflect that it's not playing
        toast({
          variant: 'destructive',
          title: 'Playback Error',
          description: 'Audio could not be played automatically. Please click play again.',
        });
      });
    }
  }, [audioUrl, toast]);


  const handlePlay = async () => {
    setIsLoading(true);
    setError(null);
    setAudioUrl(''); // Reset audio URL to force re-render and re-fetch

    const result = await synthesizeSpeech({ text: translatedText });

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
            <div className="relative text-foreground whitespace-pre-wrap leading-relaxed">
                {hasAudio && (
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-accent/70 to-accent/10 pointer-events-none -z-10"
                        style={{
                            width: `${progress}%`,
                            transition: isPlaying ? 'width 0.1s linear' : 'none',
                        }}
                    />
                )}
                <span className="relative z-0">{translatedText}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col items-center space-y-4 pt-4">
        <audio ref={audioRef} crossOrigin="anonymous" />
        
        <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-2 self-end">
                 <Button
                    onClick={togglePlayPause}
                    size="icon"
                    variant="ghost"
                    className="rounded-full w-12 h-12"
                    aria-label={isPlaying ? "Pause" : "Play"}
                    disabled={isLoading}
                    >
                    {isLoading ? (
                        <LoaderCircle className="h-6 w-6 animate-spin" />
                    ) : isPlaying ? (
                        <Pause className="h-6 w-6 fill-primary" />
                    ) : (
                        <Play className="h-6 w-6 fill-primary" />
                    )}
                </Button>
                {!hasAudio && !isLoading && <p className="text-xs text-muted-foreground">Click to Play</p>}
            </div>
        </div>
      </div>
    </div>
  );
}
