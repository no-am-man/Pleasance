// src/app/wiki/page.tsx
"use client";

import Image from "next/image";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ArrowRight, LoaderCircle } from "lucide-react";
import { FederationDiagram } from "@/components/federation-diagram";
import { useTranslation } from "@/hooks/use-translation";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useEffect, useState } from "react";

function FeatureCard({ title, description, imageUrl, imageHint, isFirst, ctaText, ctaLink, t }: { title: string, description: string, imageUrl: string, imageHint: string, isFirst: boolean, ctaText: string, ctaLink: string, t: (key: string) => string }) {
    return (
        <Card className="flex flex-col md:flex-row items-stretch overflow-hidden shadow-lg transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl h-full">
            <div className="md:w-1/2">
                <div className="relative w-full h-64 md:h-full">
                    <Image
                        src={imageUrl}
                        alt={description}
                        fill
                        style={{ objectFit: 'cover' }}
                        data-ai-hint={imageHint}
                    />
                </div>
            </div>
            <div className="md:w-1/2 flex flex-col">
                <CardHeader>
                    <CardTitle className="font-headline capitalize">{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                    <p className="text-muted-foreground flex-grow">{description}</p>
                     {isFirst && (
                        <Button asChild className="mt-6">
                            <Link href={ctaLink}>
                                {ctaText} <ArrowRight className="ms-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </CardContent>
            </div>
        </Card>
    );
}

export default function WikiPage() {
    const { t, isLoading } = useTranslation();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (isLoading || !isClient) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }
    
    const features = [
        {
            "id": "wiki-community",
            "title": "feature_community_title",
            "description": "feature_community_desc"
        },
        {
            "id": "wiki-workshop",
            "title": "feature_workshop_title",
            "description": "feature_workshop_desc"
        },
        {
            "id": "wiki-museum",
            "title": "feature_museum_title",
            "description": "feature_museum_desc"
        },
        {
            "id": "wiki-lingua",
            "title": "feature_lingua_title",
            "description": "feature_lingua_desc"
        },
        {
            "id": "wiki-fabrication",
            "title": "feature_fabrication_title",
            "description": "feature_fabrication_desc"
        },
        {
            "id": "wiki-treasury",
            "title": "feature_treasury_title",
            "description": "feature_treasury_desc"
        }
    ];

    const exploreCta = t('exploreCommunities');

    return (
        <div className="container mx-auto max-w-4xl py-12 px-4">
            <div className="text-center mb-12">
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-primary font-headline" data-testid="main-heading">
                    {t('pleasance')}
                </h1>
                <p className="mt-4 text-xl text-muted-foreground">
                    {t('federationSubtitle')}
                </p>
            </div>
            
             <div className="my-16 mx-auto max-w-sm">
                <FederationDiagram t={t} />
            </div>

            <div className="mt-16 text-center">
                <h2 className="text-4xl font-bold font-headline mb-4">{t('flowOfCreationTitle')}</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {t('flowOfCreationDescription')}
                </p>
            </div>

            <div className="mt-20">
                <h2 className="text-4xl font-bold text-center mb-12 font-headline">{t('coreConceptsTitle')}</h2>
                <div className="grid grid-cols-1 gap-8">
                    {features.map((feature: any, index: number) => {
                        const placeholder = PlaceHolderImages.find(p => p.id === feature.id);
                        return (
                            <FeatureCard
                                key={feature.id}
                                title={t(feature.title)}
                                description={t(feature.description)}
                                imageUrl={placeholder?.imageUrl || ''}
                                imageHint={placeholder?.imageHint || ''}
                                isFirst={index === 0}
                                ctaText={exploreCta}
                                ctaLink="/"
                                t={t}
                            />
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
