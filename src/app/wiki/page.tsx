// src/app/wiki/page.tsx
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Warehouse, Banknote, Info, PartyPopper, Github, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const FeatureCard = ({ icon, title, imageUrl, imageHint, children }: { icon: React.ReactNode, title: string, imageUrl: string, imageHint: string, children: React.ReactNode }) => (
    <Card className="shadow-lg flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4">
            <div className="bg-primary/10 rounded-full p-3 w-fit">
                {icon}
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
             <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    data-ai-hint={imageHint}
                />
            </div>
            <p className="text-muted-foreground leading-relaxed pt-4">{children}</p>
        </CardContent>
    </Card>
);


export default function WikiPage() {
  return (
    <main className="container mx-auto min-h-screen max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
          <Info /> The No-Am Wiki
        </h1>
        <p className="text-lg text-muted-foreground mt-2">A guide to the principles and tools of this sovereign federation.</p>
      </div>
      
      <div className="space-y-8">

        <Card className="shadow-lg bg-gradient-to-br from-card to-accent/20">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <PartyPopper className="h-8 w-8 text-primary"/>
                    <CardTitle>Version 3.0.0 is Live!</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-lg">
                    This major update introduces the collaborative AI Workshop, a real-time creative space where members of the Federation can experiment with generative tools together.
                </p>
                <Button asChild>
                    <Link href="https://github.com/no-am-man/Pleasance" target="_blank" rel="noopener noreferrer">
                        <Github className="mr-2" /> View on GitHub
                    </Link>
                </Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Core Philosophy</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-lg">
                    This is a federation, not a platform. It is a loose collection of sovereign individuals and the communities they choose to form. Value is created and exchanged freely. Your data is yours, your assets are yours, your communities are yours. This is a space for radical self-reliance and voluntary cooperation. This guide—this wiki—is not a set of rules, but a map of the tools available to you. Use them as you see fit.
                </p>
            </CardContent>
        </Card>

        <FeatureCard 
            icon={<Users className="h-8 w-8 text-primary" />} 
            title="Community Federation"
            imageUrl="https://picsum.photos/seed/101/600/400"
            imageHint="community people"
        >
            The Federation is the social fabric. It's where you find or form your tribe. Each community is a self-governing entity, created and owned by its founder. You can create a community around any interest—a language, a technology, a philosophy. Populate it with AI members to spark conversation or invite other sovereign individuals to join your cause. There are no central authorities here.
        </FeatureCard>

        <FeatureCard 
            icon={<Beaker className="h-8 w-8 text-primary" />} 
            title="AI Workshop"
            imageUrl="https://picsum.photos/seed/105/600/400"
            imageHint="ai collaboration"
        >
            The AI Workshop is a real-time, collaborative creative space. Anyone in the Federation can join and experiment with generative AI tools together. See who's currently in the workshop, generate 3D point-cloud art (SVG3D) from a prompt, and watch as the creation updates live for everyone. It's a shared sandbox for collective imagination.
        </FeatureCard>
        
        <FeatureCard 
            icon={<BookOpen className="h-8 w-8 text-primary" />} 
            title="Nuncy Lingua"
            imageUrl="https://picsum.photos/seed/102/600/400"
            imageHint="language books"
        >
            Knowledge is a form of capital. Nuncy Lingua is a tool to increase your intellectual wealth. Use it to learn new languages through AI-generated stories and listen to them with a karaoke-style speech player. The more you know, the more you are worth.
        </FeatureCard>

        <FeatureCard 
            icon={<Warehouse className="h-8 w-8 text-primary" />} 
            title="Fabrication Service"
            imageUrl="https://picsum.photos/seed/103/600/400"
            imageHint="3d printer"
        >
            Ideas are worthless without execution. The Fabrication service is where the digital becomes physical. Submit assets from your Treasury to the ticketing system to have them manufactured by a network of suppliers. Track your order from 'pending' to 'shipped'. Create, build, and own.
        </FeatureCard>
        
        <FeatureCard 
            icon={<Banknote className="h-8 w-8 text-primary" />} 
            title="The Treasury"
            imageUrl="https://picsum.photos/seed/104/600/400"
            imageHint="gold coins"
        >
            Your sovereignty is backed by your assets. The Treasury is your personal ledger. Here, you declare and manage your holdings, both physical and intellectual. This is not a bank; it is a declaration of your personal value within the Federation. What you own is a measure of your influence and independence.
        </FeatureCard>
      </div>

    </main>
  );
}
