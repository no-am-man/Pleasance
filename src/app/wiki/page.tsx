// src/app/wiki/page.tsx
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Warehouse, Banknote, Info, PartyPopper, Github, Beaker, Bug, GalleryHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { KanbanIcon } from '@/components/icons/kanban-icon';
import { Svg3dCube } from '@/components/icons/svg3d-cube';

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
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3 font-headline">
          <Info /> The Wiki
        </h1>
        <p className="text-lg text-muted-foreground mt-2">A guide to the principles and tools of this Federated Republic.</p>
      </div>
      
      <div className="space-y-8">

        <Card className="shadow-lg bg-gradient-to-br from-card to-primary/10">
            <CardHeader>
                <CardTitle>Core Philosophy</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-lg">
                    This is a Federated Republic of the Spirit. It is a space for communion, co-learning, and creation. Our tools are designed to facilitate self-governance and collaboration.
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
            The social fabric of the republic. It's where you find or form your community. Each community is a self-governing body with its own private gallery, created and guided by its founder.
        </FeatureCard>
        
        <FeatureCard
            icon={<Svg3dCube className="h-8 w-8 text-primary" />}
            title="Guide to SVG3D"
            imageUrl="https://picsum.photos/seed/108/600/400"
            imageHint="3d wireframe"
            href="/wiki/svg3d"
        >
            Understand the technology behind our generative 3D art. This guide explains what a point-cloud is, how the AI interprets your prompts, and how you can take your virtual creation into the physical world.
        </FeatureCard>

        <FeatureCard 
            icon={<KanbanIcon className="h-8 w-8 text-primary" />} 
            title="Project Roadmap"
            imageUrl="https://picsum.photos/seed/106/600/400"
            imageHint="kanban board"
            href="/roadmap"
        >
            Follow the public development plan for this project on our real-time board. See what ideas are being considered, what's next up, what's in progress, and what's already live.
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
            Knowledge is wealth. Nuncy Lingua is a tool to increase your intellectual holdings. Use it to learn new languages through AI-generated parables and listen to them with a karaoke-style speech player.
        </FeatureCard>

        <FeatureCard 
            icon={<Warehouse className="h-8 w-8 text-primary" />} 
            title="Workshop of Manifestation"
            imageUrl="https://picsum.photos/seed/103/600/400"
            imageHint="3d printer"
            href="/fabrication"
        >
            Ideas require a vessel. The Workshop of Manifestation is where the ethereal becomes tangible. Submit creations from your Treasury to the ticketing system to have them manifested by a network of artisans. Track your creation from 'pending' to 'delivered'.
        </FeatureCard>
        
        <FeatureCard 
            icon={<Banknote className="h-8 w-8 text-primary" />} 
            title="Treasury"
            imageUrl="https://picsum.photos/seed/104/600/400"
            imageHint="gold coins"
            href="/treasury"
        >
            Your worth is measured by your creations. The Treasury is your personal ledger. Here, you declare and manage your holdings, both physical and intellectual. This is a declaration of your contributions to the republic.
        </FeatureCard>
      </div>

    </main>
  );
}
