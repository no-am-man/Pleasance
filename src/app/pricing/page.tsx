// src/app/pricing/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, DollarSign, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';
import { LoaderCircle } from 'lucide-react';

export default function PricingPage() {
  const { t, tData, isLoading } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const tiers = tData('pricing_tiers') || [];

  return (
    <main className="container mx-auto min-h-screen max-w-5xl py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3 font-headline" data-testid="main-heading">
          <DollarSign className="w-10 h-10" />
          {t('pricing_title')}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          {t('pricing_subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {tiers.map((tier: any) => (
          <Card
            key={tier.name}
            className={cn(
              'shadow-lg flex flex-col h-full',
              tier.highlight && 'border-primary border-2 shadow-primary/20'
            )}
          >
            <CardHeader className="text-center">
              {tier.highlight && (
                <div className="flex justify-center mb-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    <Star className="h-4 w-4" />
                    {tier.highlight}
                  </div>
                </div>
              )}
              <CardTitle className="text-3xl font-headline">{tier.name}</CardTitle>
              <CardDescription>
                <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                <span className="text-muted-foreground">{tier.frequency}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-center text-muted-foreground mb-6">{tier.description}</p>
              <ul className="space-y-3">
                {tier.features.map((feature: any, index: number) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant={tier.highlight ? 'default' : 'outline'}>
                <Link href={tier.name === 'Congregation' ? '/login' : '#'}>{tier.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <Card className="mt-12 text-center bg-muted/50">
          <CardHeader>
            <CardTitle>{t('pricing_note_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('pricing_note_desc')}
            </p>
          </CardContent>
        </Card>
    </main>
  );
}
