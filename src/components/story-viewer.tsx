
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, LoaderCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLanguage } from "./language-provider";

type Story = {
    id: string;
    userId: string;
    nativeText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    audioUrl?: string; 
    status?: 'processing' | 'complete' | 'failed';
};

type StoryViewerProps = {
  story: Story;
  autoplay?: boolean;
};

const rtlLanguages = ['Arabic', 'Hebrew', 'Aramaic', 'Yiddish'];
const isRtl = (lang: string) => rtlLanguages.includes(lang);


// A component for the karaoke-style text highlighting
const KaraokeText = ({ text, totalDuration, currentTime, isMuted, language }: { text: string; totalDuration: number; currentTime: number; isMuted: boolean; language: string; }) => {
    
    const isRtlLanguage = isRtl(language);

    if (totalDuration === 0 || !text) {
        return <p className={cn("whitespace-pre-wrap leading-relaxed", isMuted ? "text-muted-foreground" : "text-foreground", isRtlLanguage && "text-right")} dir={isRtlLanguage ? "rtl" : "ltr"}>{text}</p>;
    }
    
    const progress = (currentTime / totalDuration) * 100;
    
    // Animate from top to bottom by changing the bottom inset value.
    const clipPathStyle = `inset(0 0 ${100 - progress}% 0)`;


    return (
        <div className="relative">
            {/* Base text layer */}
            <p 
                className={cn("whitespace-pre-wrap leading-relaxed", isMuted ? "text-muted-foreground" : "text-foreground", isRtlLanguage && "text-right")} 
                aria-hidden="true"
                dir={isRtlLanguage ? "rtl" : "ltr"}
            >
                {text}
            </p>
            {/* Highlighted text layer, revealed by a clipping mask */}
            <div
                className={cn(
                    "absolute top-0 w-full h-full",
                    isRtlLanguage ? "right-0" : "left-0"
                )}
                style={{
                    clipPath: clipPathStyle,
                }}
            >
                <p className={cn("whitespace-pre-wrap leading-relaxed bg-gradient-to-r from-fuchsia-500 to-yellow-500 bg-clip-text text-transparent", isRtlLanguage && "text-right")} dir={isRtlLanguage ? "rtl" : "ltr"}>{text}</p>
            </div>
        </div>
    );
};


export default function StoryViewer({ story, autoplay = false }: StoryViewerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const { toast } = useToast();
  const { direction } = useLanguage();

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
         audio.play().catch(e => console.error("Autoplay failed:", e));
      }
    } else if (!story.audioUrl) {
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
        audio.play().catch(e => console.error("Playback failed:", e));
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
        <div className={cn("flex flex-col md:flex-row items-start justify-center gap-8", direction === 'rtl' && 'md:flex-row-reverse')}>
            {/* Original Story Panel */}
            <div className="w-full md:w-5/12">
                <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row justify-between items-start">
                        <CardTitle>Original Story ({story.sourceLanguage})</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(story.nativeText, 'original')}>
                            <Copy className="w-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                         <KaraokeText text={story.nativeText} totalDuration={duration} currentTime={currentTime} isMuted={true} language={story.sourceLanguage} />
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
                    <CardTitle>Translated Story ({story.targetLanguage})</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(story.translatedText, 'translated')}>
                        <Copy className="w-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <KaraokeText text={story.translatedText} totalDuration={duration} currentTime={currentTime} isMuted={false} language={story.targetLanguage} />
                </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
