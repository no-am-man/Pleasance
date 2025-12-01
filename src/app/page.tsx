import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Sparkles, Mic } from 'lucide-react';
import { Logo } from '@/components/icons';

export default function Home() {
  return (
    <main className="container mx-auto min-h-[80vh] flex flex-col items-center justify-center text-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-4">
        <Logo className="h-16 w-16 text-primary" />
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-primary">
          LinguaTune
        </h1>
      </div>
      <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground mb-8">
        Welcome to the Community Federation. A place to create, explore, and connect with co-learning communities built around shared interests and voice.
      </p>

      <Button asChild size="lg">
        <Link href="/community">
          <Users className="mr-2 h-5 w-5" />
          Enter the Federation
        </Link>
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 w-full max-w-4xl">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mt-4">Create Your World</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Use a simple prompt to generate a new community, complete with AI-powered members and a unique welcome message.
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
              <Mic className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mt-4">Connect with Voice</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Experience a more personal connection with voice-based welcomes and interactions, moving beyond text-only communication.
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mt-4">Build a Federation</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Each community is a unique entity. As a creator, you can build and manage a federation of multiple communities.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
