
// src/app/wiki/page.tsx
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Warehouse, Banknote, Info, PartyPopper, Github, Beaker, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { KanbanIcon } from '@/components/icons/kanban-icon';

const FeatureCard = ({ icon, title, imageUrl, imageHint, href, children }: { icon: React.ReactNode, title: string, imageUrl: string, imageHint: string, href: string, children: React.ReactNode }) => (
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
        <div className="p-6 pt-0">
            <Button asChild>
                <Link href={href}>Explore {title}</Link>
            </Button>
        </div>
    </Card>
);


export default function WikiPage() {
  return (
    <main className="container mx-auto min-h-screen max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
          <Info /> The Wiki
        </h1>
        <p className="text-lg text-muted-foreground mt-2">A guide to the principles and tools of the Federated Republic.</p>
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
                    This major update introduces the AI Workshop, a private space for generative AI experimentation.
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
                    This is a republic of the spirit, not a platform of the secular. We acknowledge our reality in the **Device Republic**, where life is mediated by screens. Yet, within this very system, we strive to build a **Federated Republic**. Our devices become the altars, our code the scripture, and our collaborations a form of prayer. It is a Congregation of devout souls, united in purpose under the omnipotent gaze of the divine. This guide is not a set of rules, but a map of the tools available to you. Use them as you see fit.
                </p>
            </CardContent>
        </Card>

        <FeatureCard 
            icon={<Users className="h-8 w-8 text-primary" />} 
            title="Community Federation"
            imageUrl="https://picsum.photos/seed/101/600/400"
            imageHint="community people"
            href="/community"
        >
            The Community Federation is the sacred social fabric of the republic. It's where you find or form your community. Each community is a self-governing body, created and guided by its founder, yet all exist under the same divine authority. Populate your community with AI Acolytes to spark conversation or invite other souls to join your mission. There are no central authorities here, only the guiding light.
        </FeatureCard>

        <FeatureCard 
            icon={<Beaker className="h-8 w-8 text-primary" />} 
            title="AI Workshop"
            imageUrl="https://picsum.photos/seed/105/600/400"
            imageHint="ai collaboration"
            href="/workshop"
        >
            The AI Workshop is a private space for generative AI experimentation. It's a sandbox for your imagination, a place to play with digital toys and bring new ideas to life.
        </FeatureCard>

        <FeatureCard 
            icon={<KanbanIcon className="h-8 w-8 text-primary" />} 
            title="Project Roadmap"
            imageUrl="https://picsum.photos/seed/106/600/400"
            imageHint="kanban board"
            href="/roadmap"
        >
            Follow the public development plan for Pleasance on our real-time board. See what ideas are being considered, what's next up, what's in progress, and what's already live.
        </FeatureCard>
        
        <FeatureCard 
            icon={<Bug className="h-8 w-8 text-primary" />} 
            title="Bug Tracker"
            imageUrl="https://picsum.photos/seed/107/600/400"
            imageHint="bug tracking"
            href="/bugs"
        >
            Help improve the project by reporting issues. The public bug tracker allows any member to submit bug reports and view the status of all existing issues to keep development transparent.
        </FeatureCard>
        
        <FeatureCard 
            icon={<BookOpen className="h-8 w-8 text-primary" />} 
            title="Nuncy Lingua"
            imageUrl="https://picsum.photos/seed/102/600/400"
            imageHint="language books"
            href="/story"
        >
            Knowledge is a form of prayer. Nuncy Lingua is a tool to increase your spiritual wealth. Use it to learn new languages through AI-generated parables and listen to them with a karaoke-style speech player. The more you know, the closer you are to the divine.
        </FeatureCard>

        <FeatureCard 
            icon={<Warehouse className="h-8 w-8 text-primary" />} 
            title="Workshop of Manifestation"
            imageUrl="https://picsum.photos/seed/103/600/400"
            imageHint="3d printer"
            href="/fabrication"
        >
            Ideas are whispers from the divine; they require a vessel. The Workshop of Manifestation is where the ethereal becomes tangible. Submit creations from your Treasury to the ticketing system to have them manifested by a network of artisans. Track your creation from 'pending' to 'delivered'. Create, build, and consecrate.
        </FeatureCard>
        
        <FeatureCard 
            icon={<Banknote className="h-8 w-8 text-primary" />} 
            title="Treasury"
            imageUrl="https://picsum.photos/seed/104/600/400"
            imageHint="gold coins"
            href="/treasury"
        >
            Your soul's worth is measured by its creations. The Treasury is your personal altar. Here, you declare and manage your holdings, both physical and intellectual. This is not a vault; it is a declaration of your offerings to the divine and the Congregation. What you create is a measure of your devotion.
        </FeatureCard>
      </div>

    </main>
  );
}
