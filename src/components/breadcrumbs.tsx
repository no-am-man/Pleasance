'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Fragment, useState, useEffect } from 'react';
import { Home, LoaderCircle } from 'lucide-react';
import { firestore } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

// A custom hook to fetch the community name
function useCommunityName(communityId: string | null) {
    const [communityName, setCommunityName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!communityId || !firestore) {
            setCommunityName(null);
            return;
        }

        setIsLoading(true);
        const fetchName = async () => {
            try {
                const communityDocRef = doc(firestore, 'communities', communityId);
                const docSnap = await getDoc(communityDocRef);
                if (docSnap.exists()) {
                    setCommunityName(docSnap.data().name);
                } else {
                    setCommunityName(communityId); // Fallback to ID if not found
                }
            } catch {
                setCommunityName(communityId); // Fallback on error
            } finally {
                setIsLoading(false);
            }
        };

        fetchName();
    }, [communityId]);

    return { communityName, isLoading };
}


export function Breadcrumbs() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);

  const communityId = pathSegments[0] === 'community' && pathSegments.length > 1 ? pathSegments[1] : null;
  const { communityName, isLoading } = useCommunityName(communityId);


  const formatSegment = (segment: string, index: number) => {
    // If this is the community ID segment, use the fetched name
    if (index === 1 && pathSegments[0] === 'community' && communityName) {
        return communityName;
    }
    // Default formatting for other segments
    return segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  return (
    <Breadcrumb className="px-4 h-full flex items-center">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" aria-label="Home">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.length > 0 && <BreadcrumbSeparator />}
        {pathSegments.map((segment, index) => {
          const href = '/' + pathSegments.slice(0, index + 1).join('/');
          const isLast = index === pathSegments.length - 1;
          const isCommunityIdSegment = index === 1 && pathSegments[0] === 'community';
          
          let formattedSegment = formatSegment(decodeURIComponent(segment), index);
          
          if (isCommunityIdSegment && isLoading) {
            formattedSegment = 'Loading...';
          }


          return (
            <Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center">
                    {isCommunityIdSegment && isLoading && <LoaderCircle className="h-3 w-3 mr-1.5 animate-spin" />}
                    {formattedSegment}
                    </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href} className="flex items-center">
                        {isCommunityIdSegment && isLoading && <LoaderCircle className="h-3 w-3 mr-1.5 animate-spin" />}
                        {formattedSegment}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
