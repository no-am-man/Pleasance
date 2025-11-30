
// src/app/community/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, LoaderCircle, User, Crown, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { COMMUNITY_DATA, Member } from "@/config/community-data";
import { generateSpeech } from "@/ai/flows/generate-speech";

const roleIcons: { [key: string]: React.ReactNode } = {
  Founder: <Crown className="h-5 w-5 text-amber-500" />,
  Moderator: <Shield className="h-5 w-5 text-blue-500" />,
  Member: <User className="h-5 w-5 text-gray-500" />,
};

export default function CommunityPage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioDataUri, setAudioDataUri] = useState<string>("");

  useEffect(() => {
    async function getWelcomeAudio() {
      try {
        const result = await generateSpeech({ text: COMMUNITY_DATA.welcomeMessage });
        if (result.media) {
          setAudioDataUri(result.media);
        }
      } catch (error) {
        console.error("Failed to generate welcome audio:", error);
      } finally {
        setIsLoading(false);
      }
    }
    getWelcomeAudio();
  }, []);
  

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlaybackEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("ended", handlePlaybackEnded);

    return () => {
      audio.removeEventListener("ended", handlePlaybackEnded);
    };
  }, [audioDataUri]);

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
    <main className="container mx-auto min-h-screen max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <Card className="mb-8 shadow-lg">
        <CardHeader className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">
            {COMMUNITY_DATA.name}
          </h1>
          <p className="text-lg text-muted-foreground">{COMMUNITY_DATA.description}</p>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <Separator />
          <h2 className="text-2xl font-semibold pt-4">Voice Welcome</h2>
          <p className="text-center text-muted-foreground max-w-2xl">
            {COMMUNITY_DATA.welcomeMessage}
          </p>
          {isLoading ? (
             <Button size="lg" className="rounded-full w-16 h-16 shadow-lg" disabled>
                <LoaderCircle className="h-8 w-8 animate-spin" />
             </Button>
          ) : (
            audioDataUri && (
              <>
                <audio ref={audioRef} src={audioDataUri} />
                <Button
                  onClick={togglePlayPause}
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full w-16 h-16 shadow-lg"
                  aria-label={isPlaying ? "Pause Welcome Message" : "Play Welcome Message"}
                >
                  {isPlaying ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8 ml-1" />
                  )}
                </Button>
              </>
            )
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Community Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {COMMUNITY_DATA.members.map((member: Member) => (
              <li key={member.id} className="flex items-center space-x-4 p-2 rounded-md transition-colors hover:bg-muted/50">
                <Avatar>
                  <AvatarImage src={member.avatarUrl} alt={member.name} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </div>
                <div>{roleIcons[member.role]}</div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
