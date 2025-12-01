
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, LoaderCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";

type StoryViewerProps = {
  originalStory: string;
  translatedText: string;
  audioUrl: string;
  sourceLanguage: string;
  onPlay: () => void;
  isLoading: boolean;
};

export default function StoryViewer({
  originalStory,
  translatedText,
  audioUrl,
  sourceLanguage,
  onPlay,
  isLoading,
}: StoryViewerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasAudio = audioUrl && audioUrl.length > 0;

  // Effect for handling audio lifecycle
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
      setCurrentTime(audio.duration); // Ensure slider goes to the end
    };

    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", handlePlaybackEnded);
    
    // Cleanup
    return () => {
      audio.removeEventListener("loadeddata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", handlePlaybackEnded);
    };
  }, []);

  // Effect to play audio when URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audioUrl) {
      audio.src = audioUrl;
      audio.play().then(() => setIsPlaying(true)).catch(e => console.error("Autoplay failed", e));
    }
  }, [audioUrl]);


  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!hasAudio) {
      onPlay();
      return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
        if (audio.currentTime >= audio.duration) {
            audio.currentTime = 0; // Restart if at the end
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

  return (
    <div className="animate-in fade-in-50 duration-500 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Original Story ({sourceLanguage})</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {originalStory}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Translated Story</CardTitle>
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
        <Button
          onClick={togglePlayPause}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-16 h-16 shadow-lg"
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
  );
}
