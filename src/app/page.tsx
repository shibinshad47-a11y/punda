'use client';

import React, { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { SplashScreen } from '@/components/common/SplashScreen';

export default function HomePage() {
  return (
    <Suspense fallback={<SplashScreen message="Loading PUNDA Messenger..." />}>
      <AppShell />
    </Suspense>
  );
}
