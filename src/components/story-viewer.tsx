
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


export default function StoryViewer({ story, autoplay = false }: StoryViewerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const { toast } = useToast();

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
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
        audio.play().catch(e => console.error("Autoplay was prevented:", e));
      }
    } else if (!story.audioUrl) {
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
  
  const HighlightLayer = ({ progress, isPlaying }: { progress: number, isPlaying: boolean }) => (
    <div
      className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-yellow-400/50 to-yellow-400/20 pointer-events-none -z-10 opacity-70"
      style={{
        width: '15%', // Width of the highlight gradient
        left: `${progress}%`,
        transition: isPlaying ? 'left 0.1s linear' : 'none',
        filter: 'blur(20px)', // Softens the edges of the gradient
      }}
    />
  );


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
                        <div className="relative text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {hasAudio && <HighlightLayer progress={progress} isPlaying={isPlaying} />}
                            <p>
                                {story.nativeText}
                            </p>
                        </div>
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
                    <div className="relative text-foreground whitespace-pre-wrap leading-relaxed">
                        {hasAudio && <HighlightLayer progress={progress} isPlaying={isPlaying} />}
                        <p>
                            {story.translatedText}
                        </p>
                    </div>
                </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
