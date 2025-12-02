
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const { toast } = useToast();

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isProcessing = story.status === 'processing';
  const hasAudio = story.audioUrl && story.audioUrl.length > 0;

  // Consolidated useEffect for all audio handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // --- Event Listeners Setup ---
    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };
    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const handlePlaybackEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0); // Reset on end
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", handlePlaybackEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    
    // --- Source and Autoplay Logic ---
    if (story.audioUrl && audio.src !== story.audioUrl) {
      audio.src = story.audioUrl;
      audio.load();
      if (autoplay) {
        // The 'play' event listener will set isPlaying to true.
        audio.play().catch(e => console.error("Autoplay failed:", e));
      }
    } else if (!story.audioUrl) {
        audio.pause();
    }
    
    // --- Cleanup function ---
    return () => {
      // Pause and reset time when component unmounts or story changes
      audio.pause();
      // Remove all listeners
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
      audio.play().catch(e => console.error("Playback error:", e));
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
            </div>
            
            {/* Play Button */}
            <div className="w-full md:w-auto flex justify-center self-center order-first md:order-none">
                 <Button
                    onClick={togglePlayPause}
                    size="icon"
                    className="rounded-full w-20 h-20 bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
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
    </div>
  );
}
