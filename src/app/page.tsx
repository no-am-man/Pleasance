
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
  Book,
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
          A Federated Republic of the Spirit. A space for communion, co-learning, and creation.
        </p>
      </div>

      <div className="w-full max-w-lg mx-auto my-8">
        <FederationDiagram />
      </div>

      <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader>
              <CardTitle className="text-2xl">A Model of Federated Sovereignty</CardTitle>
              <CardDescription>An academic overview of the system architecture.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
              <p>
                  The diagram illustrates a decentralized system architecture centered on the sovereign individual. The 'Sovereign Soul' acts as the primary node, initiating creative and intellectual endeavors within specialized modules like the 'AI Workshop' and 'Nuncy Lingua'.
              </p>
              <p>
                  Creations are cataloged in a personal 'Treasury,' a ledger of intellectual property. This Treasury serves as the source for two primary outputs: manifestation into physical form via the 'Workshop of Manifestation,' and contribution to the 'Federation' of self-governing communities.
              </p>
               <p>
                  The entire system is guided by a set of meta-tools—the Wiki, Roadmap, Conductor, and Bug Tracker—which provide transparency, direction, and operational assistance to all participants. This model prioritizes individual agency while enabling collective action and shared governance.
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
