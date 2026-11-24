import React, { Suspense } from 'react';
import InviteContent from './InviteContent';
import { SplashScreen } from '@/components/common/SplashScreen';

export const dynamic = 'force-dynamic';

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <Suspense fallback={<SplashScreen message="Connecting to PUNDA invite..." />}>
      <InviteContent inviteCode={code} />
    </Suspense>
  );
}
