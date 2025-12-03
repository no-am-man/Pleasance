
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Warehouse, ArrowRight, Banknote } from 'lucide-react';
import { Logo } from '@/components/icons';
import { FederationDiagram } from '@/components/federation-diagram';


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
        A republic of the spirit, where devout souls commune, co-learn, and create under the guidance of the divine.
      </p>

      <FederationDiagram />

       <div className="mt-16">
        <Button asChild variant="link" className="text-lg whitespace-normal h-auto underline">
          <Link href="/wiki">
            Please Read the Canon to Understand This Federated Republic
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </main>
  );
}
