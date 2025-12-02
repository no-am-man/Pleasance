
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, LoaderCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

// A component for the karaoke-style text highlighting
const KaraokeText = ({ text, totalDuration, currentTime }: { text: string; totalDuration: number; currentTime: number; }) => {
    const lines = text.split('\n');
    const totalChars = text.length;
    
    if (totalDuration === 0) {
        return <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{text}</p>;
    }

    // Estimate the time per character
    const timePerChar = totalDuration / totalChars;
    let accumulatedChars = 0;

    return (
        <div className="leading-relaxed space-y-2">
            {lines.map((line, lineIndex) => {
                const lineStartChar = accumulatedChars;
                const lineEndChar = accumulatedChars + line.length;
                accumulatedChars = lineEndChar + 1; // +1 for the newline character

                const lineStartTime = lineStartChar * timePerChar;
                const lineEndTime = lineEndChar * timePerChar;

                const isLineActive = currentTime >= lineStartTime && currentTime < lineEndTime;
                const lineProgress = isLineActive
                    ? Math.min(100, ((currentTime - lineStartTime) / (lineEndTime - lineStartTime)) * 100)
                    : (currentTime >= lineEndTime ? 100 : 0);

                if (line.trim() === '') {
                    return <div key={lineIndex} className="h-4" />;
                }

                return (
                    <div key={lineIndex} className="relative whitespace-pre-wrap">
                        {/* Base text layer (the color of the un-highlighted text) */}
                        <p className="text-muted-foreground" aria-hidden="true">
                            {line}
                        </p>
                        {/* Highlighted text layer, revealed by a clipping mask */}
                        <div
                            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary to-primary bg-no-repeat text-transparent"
                            style={{
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                clipPath: `inset(0 ${100 - lineProgress}% 0 0)`,
                                transition: isLineActive ? 'clip-path 0.1s linear' : 'none',
                            }}
                        >
                            <p className="text-primary">{line}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


export default function StoryViewer({ story, autoplay = false }: StoryViewerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const { toast } = useToast();

  const isProcessing = story.status === 'processing';
  const hasAudio = story.audioUrl && story.audioUrl.length > 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };
    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const handlePlaybackEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    // Set up event listeners
    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", handlePlaybackEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    // Load new audio source when story changes
    if (story.audioUrl && audio.src !== story.audioUrl) {
      audio.src = story.audioUrl;
      audio.load();
      if (autoplay) {
        // Attempt to play, but catch errors (e.g., browser restrictions)
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.error("Autoplay was prevented:", e));
        }
      }
    } else if (!story.audioUrl) {
        // No audio URL, ensure it's paused and reset
        audio.pause();
        audio.currentTime = 0;
    }

    // Cleanup function
    return () => {
      audio.removeEventListener("loadeddata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", handlePlaybackEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [story.id, story.audioUrl, autoplay]);


  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !hasAudio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.error("Playback error:", e));
        }
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
    <div className="animate-in fade-in-50 duration-500">
        <audio ref={audioRef} crossOrigin="anonymous"/>
        <div className="flex flex-col md:flex-row items-start justify-center gap-8">
            {/* Original Story Panel */}
            <div className="w-full md:w-5/12">
                <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row justify-between items-start">
                        <CardTitle>Original Story ({story.sourceLanguage})</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(story.nativeText, 'original')}>
                            <Copy className="w-4 h-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                         {hasAudio ? (
                            <KaraokeText text={story.nativeText} totalDuration={duration} currentTime={currentTime} />
                         ) : (
                            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{story.nativeText}</p>
                         )}
                    </CardContent>
                </Card>
            </div>
            
            {/* Play Button */}
            <div className="w-full md:w-auto flex justify-center self-center order-first md:order-none">
                 <Button
                    onClick={togglePlayPause}
                    size="icon"
                    className="rounded-full w-20 h-20 bg-primary hover:bg-primary/90 disabled:bg-gray-400"
                    aria-label={isPlaying ? "Pause" : "Play"}
                    disabled={!hasAudio || isProcessing}
                    >
                    {isProcessing ? (
                        <LoaderCircle className="w-8 h-8 animate-spin fill-white text-white" />
                    ) : isPlaying ? (
                        <Pause className="h-10 w-10 fill-white text-white" />
                    ) : (
                        <Play className="h-10 w-10 fill-white text-white ml-1" />
                    )}
                </Button>
            </div>

            {/* Translated Story Panel */}
            <div className="w-full md:w-5/12">
                <Card className="overflow-hidden">
                <CardHeader className="flex flex-row justify-between items-start">
                    <CardTitle>Translated Story</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(story.translatedText, 'translated')}>
                        <Copy className="w-4 h-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    {hasAudio ? (
                        <KaraokeText text={story.translatedText} totalDuration={duration} currentTime={currentTime} />
                    ) : (
                        <p className="text-foreground whitespace-pre-wrap leading-relaxed">{story.translatedText}</p>
                    )}
                </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
