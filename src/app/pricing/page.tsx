// src/app/pricing/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, DollarSign, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const tiers = [
  {
    name: 'Congregation',
    price: '$0',
    frequency: '/ forever',
    description: 'Join the republic and participate in the community on the free tier.',
    features: [
      'Access to the Community Federation',
      'Learn with Nuncy Lingua',
      'View the Project Roadmap & Bug Tracker',
      'Declare assets in your Treasury',
      'Uses standard AI models',
    ],
    cta: 'Join the Congregation',
    href: '/login',
    highlight: false,
  },
  {
    name: 'Clergy',
    price: '$10',
    frequency: '/ month',
    description: 'Lead the community with more powerful generative tools.',
    features: [
      'All Congregation features',
      'Create and lead your own Communities',
      'Utilize advanced AI models (Gemini 1.5 Pro)',
      'Generate flags, avatars, and art',
      'Priority access to the Fabrication workshop',
    ],
    cta: 'Become Clergy',
    href: '#', // Placeholder for subscription link
    highlight: true,
  },
  {
    name: 'Founder',
    price: '$100',
    frequency: '/ month',
    description: 'Shape the very fabric of the republic with direct influence.',
    features: [
      'All Clergy features',
      'Direct access to the founding partners',
      'Influence the project roadmap',
      'Highest priority support & fabrication',
      'Access to alpha features',
    ],
    cta: 'Join the Founders',
    href: '#', // Placeholder for subscription link
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <main className="container mx-auto min-h-screen max-w-5xl py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3 font-headline">
          <DollarSign className="w-10 h-10" />
          Tiers of Contribution
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Choose your level of commitment to the republic. Your contribution supports its growth.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {tiers.map((tier) => (
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
                    Most Popular
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
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant={tier.highlight ? 'default' : 'outline'}>
                <Link href={tier.href}>{tier.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <Card className="mt-12 text-center bg-muted/50">
          <CardHeader>
            <CardTitle>A Note on Google Genkit Usage Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The 'Clergy' and 'Founder' tiers are required to access advanced generative models like Gemini 1.5 Pro.
              An active subscription covers the associated Google Genkit API costs, ensuring the highest quality results for your creations. The free 'Congregation' tier uses standard models.
            </p>
          </CardContent>
        </Card>
    </main>
  );
}
