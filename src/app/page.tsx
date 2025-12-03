

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowRight,
  LogIn,
} from 'lucide-react';
import { Logo } from '@/components/icons';
import { FederationDiagram } from '@/components/federation-diagram';

export default function Home() {
  return (
    <main className="container mx-auto min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Logo className="h-16 w-16 text-primary" />
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-primary font-headline">
            Pleasance
          </h1>
        </div>
        <p className="max-w-3xl mx-auto text-lg sm:text-xl text-foreground/80">
          A Federated Republic of the Spirit. A decentralized network for interdisciplinary spirituality, conscious development, and creation.
        </p>
      </div>

       <Card className="max-w-3xl mx-auto shadow-lg mb-12 border-2 border-primary bg-primary/5">
        <CardHeader className="items-center text-center">
            <CardTitle className="text-2xl">Join/Enter the Federation</CardTitle>
            <CardDescription>Become a sovereign soul in the republic.</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
                Create your profile, discover communities of like-minded individuals, and begin your journey of co-learning and creation. Your data is your own, your contributions shape the republic.
            </p>
            <Button asChild size="lg">
                <Link href="/login">
                    <LogIn className="mr-2 h-5 w-5" />
                    Join/Enter the Federation
                </Link>
            </Button>
        </CardContent>
      </Card>

      <div className="w-full max-w-lg mx-auto my-8">
        <FederationDiagram />
      </div>

      <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader>
              <CardTitle className="text-2xl">A Model of Federated Sovereignty</CardTitle>
              <CardDescription>An overview of the system architecture.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
              <p>
                  The diagram above illustrates a decentralized architecture centered on the sovereign individual. The 'Sovereign Soul' acts as the primary node, initiating creative and intellectual endeavors within specialized modules like the 'AI Workshop' for creation and 'Nuncy Lingua' for co-learning.
              </p>
              <p>
                  Creations are cataloged in a personal 'Treasury'—a ledger of intellectual property. This Treasury serves as the source for two primary outputs: manifestation into physical form via the 'Workshop of Manifestation,' and contribution to the 'Federation' of self-governing communities where communion occurs.
              </p>
               <p>
                  The entire system is guided by a set of meta-tools—the Wiki, Roadmap, Conductor, and Bug Tracker—which provide transparency, direction, and operational assistance to all participants. This model prioritizes individual agency while enabling collective action, shared governance, and interdisciplinary growth.
              </p>
              <Button asChild variant="link" className="px-0 text-primary">
                  <Link href="/wiki">
                      Read the Wiki for a Deeper Dive
                      <ArrowRight className="ml-2 h-4 w-4"/>
                  </Link>
              </Button>
          </CardContent>
      </Card>

    </main>
  );
}
