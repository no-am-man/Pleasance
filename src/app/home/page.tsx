// src/app/home/page.tsx (formerly app/page.tsx)
"use client";

import Image from "next/image";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { ArrowRight } from "lucide-react";
import { FederationDiagram } from "@/components/federation-diagram";


function FeatureCard({ feature, isFirst }: { feature: ImagePlaceholder, isFirst: boolean }) {
    return (
        <Card className="flex flex-col md:flex-row items-stretch overflow-hidden shadow-lg transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl">
            <div className="md:w-1/2">
                <div className="relative w-full h-64 md:h-full">
                    <Image
                        src={feature.imageUrl}
                        alt={feature.description}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint={feature.imageHint}
                    />
                </div>
            </div>
            <div className="md:w-1/2 flex flex-col">
                <CardHeader>
                    <CardTitle className="font-headline capitalize">{feature.id.split('-').pop()}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                    <p className="text-muted-foreground flex-grow">{feature.description}</p>
                     {isFirst && (
                        <Button asChild className="mt-6">
                            <Link href="/">
                                Explore Communities <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </CardContent>
            </div>
        </Card>
    );
}

export default function HomePage() {
    return (
        <main className="container mx-auto max-w-4xl py-12 px-4">
            <div className="text-center mb-12">
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-primary font-headline">
                    Pleasance
                </h1>
                <p className="mt-4 text-xl text-muted-foreground">
                    A Federation of Social Communities
                </p>
            </div>
            
            <FederationDiagram />

            <div className="mt-16 text-center">
                <h2 className="text-4xl font-bold font-headline mb-4">The Flow of Creation</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    The diagram above illustrates the journey of an idea within the Pleasance federation, from a sovereign individual's inspiration to a tangible or communal reality. It is a cyclical process where creation, learning, and community engagement perpetually inspire new ideas.
                </p>
            </div>

            <div className="mt-20">
                <h2 className="text-4xl font-bold text-center mb-12 font-headline">Core Concepts</h2>
                <div className="space-y-8">
                    {PlaceHolderImages.map((feature, index) => (
                        <FeatureCard key={feature.id} feature={feature} isFirst={index === 0} />
                    ))}
                </div>
            </div>
        </main>
    );
}
