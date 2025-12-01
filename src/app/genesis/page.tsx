// src/app/genesis/page.tsx
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Pause, Sparkles } from "lucide-react";
import { COMMUNITY_DATA, Member } from "@/config/community-data";

function MemberCard({ member }: { member: Member }) {
    return (
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={member.avatarUrl} alt={member.name} />
            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{member.name}</CardTitle>
            <CardDescription>{member.role}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{member.bio}</p>
        </CardContent>
      </Card>
    );
  }

export default function GenesisPage() {
    const { name, description, welcomeMessage, members } = COMMUNITY_DATA;
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

  return (
    <main className="container mx-auto min-h-screen max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
          <Sparkles className="w-10 h-10" />
          {name}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">{description}</p>
      </div>

      <Card className="mb-8 shadow-lg relative overflow-hidden">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-2xl">A Message from the Founders</CardTitle>
                    <CardDescription>Our welcome message.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-lg leading-relaxed">{welcomeMessage}</p>
          <div className="flex items-center gap-4">
          <Button disabled={true}>
              {isPlaying ? (
                <>
                  <Pause className="mr-2 h-4 w-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Play Welcome
                </>
              )}
            </Button>
          </div>
          <audio ref={audioRef} className="hidden" />
        </CardContent>
      </Card>

      <div>
        <h2 className="text-3xl font-bold text-center mb-8">Community Structure</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </main>
  );
}
