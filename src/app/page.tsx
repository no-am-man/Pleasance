
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Warehouse, ArrowRight, Banknote } from 'lucide-react';
import { Logo } from '@/components/icons';

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl">
        <Card className="text-left flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
               <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Community Federation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <CardDescription>
              Discover, join, or create your own co-learning communities. Connect with AI and human members who share your passions.
            </CardDescription>
          </CardContent>
          <div className="p-6 pt-0">
             <Button asChild className="w-full text-white bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700">
                <Link href="/community">
                  Browse Communities <ArrowRight className="ml-2" />
                </Link>
              </Button>
          </div>
        </Card>
        <Card className="text-left flex flex-col">
          <CardHeader>
             <div className="flex items-center gap-4">
               <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Nuncy Pronunciation AI Detective</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <CardDescription>
              Enhance your language skills with AI-generated stories and a karaoke-style speech trainer for perfect pronunciation.
            </CardDescription>
          </CardContent>
           <div className="p-6 pt-0">
             <Button asChild className="w-full">
                <Link href="/story">
                  Start Learning <ArrowRight className="ml-2" />
                </Link>
              </Button>
          </div>
        </Card>
        <Card className="text-left flex flex-col">
          <CardHeader>
             <div className="flex items-center gap-4">
               <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <Warehouse className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Fabrication Service</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <CardDescription>
              Turn digital into physical. Upload CAD files for 3D printing or PDFs for print-on-demand books and objects.
            </CardDescription>
          </CardContent>
           <div className="p-6 pt-0">
             <Button asChild className="w-full">
                <Link href="/fabrication">
                  Submit a Job <ArrowRight className="ml-2" />
                </Link>
              </Button>
          </div>
        </Card>
         <Card className="text-left flex flex-col">
          <CardHeader>
             <div className="flex items-center gap-4">
               <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <Banknote className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Treasury</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <CardDescription>
              Declare and manage your personal sovereign assets, both physical and intellectual, within the federation.
            </CardDescription>
          </CardContent>
           <div className="p-6 pt-0">
             <Button asChild className="w-full">
                <Link href="/treasury">
                  Manage Assets <ArrowRight className="ml-2" />
                </Link>
              </Button>
          </div>
        </Card>
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
