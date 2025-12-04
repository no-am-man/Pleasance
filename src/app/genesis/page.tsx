
// src/app/genesis/page.tsx
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft } from "lucide-react";

export default function GenesisPage() {
  return (
    <main className="container mx-auto min-h-screen max-w-4xl py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <Users className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="mt-4">This Page Has Evolved!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The concept of a single "Genesis" community has grown into a full federation where you can create and discover many communities.
          </p>
          <Button asChild>
            <Link href="/community">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go to the FederalCommunitySocial
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
