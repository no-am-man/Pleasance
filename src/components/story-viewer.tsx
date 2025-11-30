"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

type StoryViewerProps = {
  originalStory: string;
  translatedText: string;
  audioDataUri: string;
  sourceLanguage: string;
};

export default function StoryViewer({
  originalStory,
  translatedText,
  audioDataUri,
  sourceLanguage,
}: StoryViewerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const hasAudio = audioDataUri && audioDataUri.length > 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !hasAudio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlaybackEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", handlePlaybackEnded);

    if (audio.readyState > 0) {
      setAudioData();
    }
    
    audio.play().then(() => setIsPlaying(true)).catch(e => console.error("Autoplay failed", e));


    return () => {
      audio.removeEventListener("loadeddata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", handlePlaybackEnded);
    };
  }, [audioDataUri, hasAudio]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

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

  return (
    <div className="animate-in fade-in-50 duration-500 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Original Story ({sourceLanguage})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative isolate">
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {originalStory}
              </p>
              {hasAudio && (
                <div
                  className="absolute top-0 left-0 h-full -z-10"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(to right, hsl(var(--accent) / 0.3), hsl(var(--accent) / 0.1))',
                    transition: isPlaying ? 'width 0.1s linear' : 'none'
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Translated Story</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {translatedText}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {hasAudio && (
        <div className="flex flex-col items-center space-y-4">
          <audio ref={audioRef} src={audioDataUri} />
          <Button
            onClick={togglePlayPause}
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full w-16 h-16 shadow-lg"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
