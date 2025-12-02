
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, LoaderCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Story = {
    id: string;
    userId: string;
    nativeText: string;
    translatedText: string;
    sourceLanguage: string;
    audioUrl?: string;
    status?: 'processing' | 'complete' | 'failed';
};

type StoryViewerProps = {
  story: Story;
  autoplay?: boolean;
};


export default function StoryViewer({ story, autoplay = false }: StoryViewerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null); // Ref for the scroll target

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isProcessing = story.status === 'processing';
  const hasAudio = story.audioUrl && story.audioUrl.length > 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [story.id]); // Scroll when story changes

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (story.audioUrl && audio.src !== story.audioUrl) {
      audio.src = story.audioUrl;
      audio.load();
    }

    // Autoplay when audioUrl becomes available and autoplay is true
    if (story.audioUrl && autoplay && !isPlaying) {
        audio.play().catch(e => {
            console.error("Autoplay failed:", e);
            setIsPlaying(false); // If autoplay fails, update the state
        });
        setIsPlaying(true);
    }

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
  }, [story.audioUrl, autoplay, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.play().catch(e => {
          console.error("Playback error:", e);
          setIsPlaying(false);
        });
      } else {
        audio.pause();
      }
    }
  }, [isPlaying]);


  const togglePlayPause = () => {
    if (hasAudio) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `The ${type} story has been copied.`,
    });
  };

  return (
    <div ref={scrollRef} className="animate-in fade-in-50 duration-500 space-y-4">
      <div className="flex flex-col items-center space-y-4">
        <audio ref={audioRef} crossOrigin="anonymous" />
        
        <Button
            onClick={togglePlayPause}
            size="icon"
            className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={!hasAudio || isProcessing}
            >
            {isProcessing ? (
                <LoaderCircle className="w-8 h-8 animate-spin fill-white text-white" />
            ) : isPlaying ? (
                <Pause className="h-8 w-8 fill-white text-white" />
            ) : (
                <Play className="h-8 w-8 fill-white text-white ml-1" />
            )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="flex flex-row justify-between items-start">
            <CardTitle>Original Story ({story.sourceLanguage})</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => handleCopy(story.nativeText, 'original')}>
                <Copy className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {story.nativeText}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row justify-between items-start">
            <CardTitle>Translated Story</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => handleCopy(story.translatedText, 'translated')}>
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
                <span className="relative z-0">{story.translatedText}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
