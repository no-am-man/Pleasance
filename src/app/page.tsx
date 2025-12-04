

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
  Landmark,
  Scaling,
  Wind,
  Coins,
  Github,
} from 'lucide-react';
import { Logo } from '@/components/icons';
import { FederationDiagram } from '@/components/federation-diagram';
import { SatoshiIcon } from '@/components/icons/satoshi-icon';
import { KanbanIcon } from '@/components/icons/kanban-icon';

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
          A Federated Republic of the Spirit for communion, co-learning, and creation.
        </p>
      </div>

       <Card className="max-w-3xl mx-auto shadow-lg mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">Interpreting "A Federated Republic of the Spirit"</CardTitle>
          <CardDescription>This term combines three concepts to define the organization's structure and mission.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                    <Landmark className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold">Republic (Community)</h3>
                    <p className="text-muted-foreground">Implies a community governed by its members, emphasizing autonomy, shared governance, and the equality of all participants in their spiritual journey.</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                    <Scaling className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold">Federated (Structure)</h3>
                    <p className="text-muted-foreground">An association of independent units that unite under a common umbrella while retaining unique identities. In Hebrew, this is known as "פדרציה קהילתית" (Community Federation), where groups pool resources and gain collective strength without sacrificing their internal autonomy. Pleasance is not a single rigid doctrine but a network that respects and integrates diverse spiritual paths.</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                 <div className="bg-primary/10 p-2 rounded-full">
                    <Wind className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold">Of the Spirit (Purpose)</h3>
                    <p className="text-muted-foreground">Defines the core focus on matters of meaning, consciousness, transcendence, and well-being, rather than material or political concerns.</p>
                </div>
            </div>
        </CardContent>
      </Card>

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
      
      <Card className="max-w-3xl mx-auto shadow-lg mb-12">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><Coins /> The Economy of Creation</CardTitle>
          <CardDescription>A system for valuing contributions within the republic.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                <SatoshiIcon className="h-12 w-12 text-primary flex-shrink-0" />
                <div>
                    <h3 className="font-semibold">The Satoshi: A Unit of Value</h3>
                    <p className="text-sm text-muted-foreground">Our unit of account is the Satoshi (<span className="inline-flex items-center gap-1 font-mono"><SatoshiIcon className="h-3.5 w-3.5" /></span>), a nod to the foundational principles of decentralized value. It is earned through creative and intellectual contributions, such as generating stories or artworks.</p>
                </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                <div className="text-4xl font-bold font-mono text-primary flex items-center gap-2">
                   1<SatoshiIcon className="w-8 h-8" /> = $1
                </div>
                 <div>
                    <h3 className="font-semibold">A Stable Measure of Worth</h3>
                    <p className="text-sm text-muted-foreground">Within the Pleasance society, the value of one Satoshi is pegged to one US Dollar. This is not a cryptocurrency; it is a stable, internal metric to provide a clear and consistent measure of the value of your creations and contributions, free from market volatility.</p>
                </div>
            </div>
        </CardContent>
      </Card>


      <div className="w-full max-w-lg mx-auto my-8">
        <FederationDiagram />
      </div>

      <Card className="max-w-3xl mx-auto shadow-lg mb-12">
          <CardHeader>
              <CardTitle className="text-2xl">A Model of Decentralized Sovereignty</CardTitle>
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
                  This model prioritizes individual agency while enabling collective action, shared governance, and interdisciplinary growth. Public tools like the Roadmap, Conductor, and Bug Tracker ensure transparency and provide direction for the entire republic.
              </p>
          </CardContent>
      </Card>
      
      <Card className="max-w-3xl mx-auto shadow-lg mb-12">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <KanbanIcon className="w-6 h-6 text-primary" /> Project Roadmap
          </CardTitle>
          <CardDescription>Follow the development of the Pleasance project.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The roadmap is a public Kanban board that outlines the current, upcoming, and completed features. It's a transparent view into the evolution of our republic.
          </p>
          <Button asChild>
            <Link href="/roadmap">
              <ArrowRight className="mr-2 h-4 w-4" />
              View the Roadmap
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-3xl mx-auto shadow-lg mb-12">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Github className="w-6 h-6 text-primary" /> Open Source & Community Driven
          </CardTitle>
          <CardDescription>This project is built in the open for all to see and contribute.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The entire codebase for Pleasance is open source. You are welcome to inspect the code, learn from it, and contribute to its development. The republic is built by and for its members.
          </p>
          <Button asChild variant="outline">
            <Link href="https://github.com/no-am-man/Pleasance" target="_blank" rel="noopener noreferrer">
              <ArrowRight className="mr-2 h-4 w-4" />
              View on GitHub
            </Link>
          </Button>
        </CardContent>
      </Card>

    </main>
  );
}




