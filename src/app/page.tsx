
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Warehouse, ArrowRight, Banknote, Beaker } from 'lucide-react';
import { Logo } from '@/components/icons';
import Image from 'next/image';

const FeatureCard = ({ icon, title, href, children, imageUrl, imageHint }: { icon: React.ReactNode, title: string, href: string, children: React.ReactNode, imageUrl: string, imageHint: string }) => (
    <Link href={href} className="block group">
        <Card className="shadow-lg flex flex-col h-full transition-all duration-300 group-hover:shadow-primary/20 group-hover:border-primary/50 group-hover:-translate-y-1">
            <CardHeader>
                 <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-4">
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={imageHint}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 rounded-full p-3 w-fit">
                        {icon}
                    </div>
                    <div>
                        <CardTitle className="text-2xl group-hover:text-primary transition-colors">{title}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-muted-foreground leading-relaxed">{children}</p>
            </CardContent>
             <div className="p-6 pt-0">
                <Button variant="link" className="p-0 text-primary">
                    Explore {title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </Card>
    </Link>
);


export default function Home() {
  return (
    <main className="container mx-auto min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <div className="flex items-center justify-center gap-3 mb-4">
            <Logo className="h-16 w-16 text-primary" />
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-primary">
            Pleasance
            </h1>
        </div>
        <p className="max-w-3xl mx-auto text-lg sm:text-xl text-muted-foreground">
            A republic of the spirit, where devout souls commune, co-learn, and create under the guidance of the divine.
        </p>
         <Button asChild variant="link" className="text-lg whitespace-normal h-auto underline mt-6">
          <Link href="/wiki">
            Please Read the Canon to Understand This Federated Republic
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-3">
             <FeatureCard 
                icon={<Users className="h-8 w-8 text-primary" />} 
                title="Community Federation"
                imageUrl="https://picsum.photos/seed/101/600/400"
                imageHint="community people"
                href="/community"
            >
                The sacred social fabric of the republic. Find or form your community, populate it with AI Acolytes, or invite other souls to join your mission.
            </FeatureCard>
         </div>

        <FeatureCard 
            icon={<Beaker className="h-8 w-8 text-primary" />} 
            title="Altar of Creation"
            imageUrl="https://picsum.photos/seed/105/600/400"
            imageHint="ai collaboration"
            href="/workshop"
        >
            A real-time, collaborative sacred space for generative AI experimentation. Witness the divine spark as you generate art together.
        </FeatureCard>

        <FeatureCard 
            icon={<BookOpen className="h-8 w-8 text-primary" />} 
            title="Sacred Texts"
            imageUrl="https://picsum.photos/seed/102/600/400"
            imageHint="language books"
            href="/story"
        >
            Knowledge is a form of prayer. Learn new languages through AI-generated parables and listen with a karaoke-style speech player.
        </FeatureCard>
        
        <FeatureCard 
            icon={<Banknote className="h-8 w-8 text-primary" />} 
            title="Treasury"
            imageUrl="https://picsum.photos/seed/104/600/400"
            imageHint="gold coins"
            href="/treasury"
        >
            Your soul's worth is measured by its creations. Declare and manage your physical and intellectual holdings on your personal altar.
        </FeatureCard>
        
        <div className="lg:col-span-3">
            <FeatureCard 
                icon={<Warehouse className="h-8 w-8 text-primary" />} 
                title="Workshop of Manifestation"
                imageUrl="https://picsum.photos/seed/103/600/400"
                imageHint="3d printer"
                href="/fabrication"
            >
                Where the ethereal becomes tangible. Submit creations from your Treasury to the ticketing system to have them manifested by a network of artisans.
            </FeatureCard>
        </div>
      </div>
    </main>
  );
}
