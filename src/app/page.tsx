
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Warehouse, ArrowRight, Banknote } from 'lucide-react';
import { Logo } from '@/components/icons';
import { FederationDiagram } from '@/components/federation-diagram';

const features = [
    {
        icon: Users,
        title: "Community Federation",
        description: "Discover, join, or create your own co-learning communities. Connect with AI and human members who share your passions.",
        href: "/community",
        cta: "Browse Communities",
        gradient: "bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
    },
    {
        icon: BookOpen,
        title: "Nuncy Lingua",
        description: "Enhance your language skills with AI-generated stories and a karaoke-style speech trainer for perfect pronunciation.",
        href: "/story",
        cta: "Start Learning"
    },
    {
        icon: Warehouse,
        title: "Fabrication Service",
        description: "Turn digital into physical. Upload CAD files for 3D printing or PDFs for print-on-demand books and objects.",
        href: "/fabrication",
        cta: "Submit a Job"
    },
    {
        icon: Banknote,
        title: "Treasury",
        description: "Declare and manage your personal sovereign assets, both physical and intellectual, within the federation.",
        href: "/treasury",
        cta: "Manage Assets"
    }
];

const FeatureCard = ({ icon: Icon, title, description, href, cta, gradient }: (typeof features)[0]) => (
    <Card className="text-left flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-4">
           <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                <Icon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription>
          {description}
        </CardDescription>
      </CardContent>
      <div className="p-6 pt-0">
         <Button asChild className={`w-full text-white ${gradient || ''}`}>
            <Link href={href}>
              {cta} <ArrowRight className="ml-2" />
            </Link>
          </Button>
      </div>
    </Card>
);


export default function Home() {
  return (
    <main className="container mx-auto min-h-[80vh] flex flex-col items-center justify-center text-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-4">
        <Logo className="h-16 w-16 text-primary" />
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-primary">
          Pleasance
        </h1>
      </div>
      <p className="max-w-3xl text-lg sm:text-xl text-muted-foreground mb-12">
        A federated universe for co-learning, creation, and fabrication. Explore communities, generate AI-powered stories, or bring your digital creations to life.
      </p>

      <FederationDiagram />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl">
        {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>

       <div className="mt-16">
        <Button asChild variant="link" className="text-lg whitespace-normal h-auto underline">
          <Link href="/wiki">
            Please Read the Wiki to Understand What You Are Joining
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </main>
  );
}
