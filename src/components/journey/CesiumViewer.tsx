'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

/**
 * Dynamically import Cesium with no SSR
 * Cesium requires browser APIs and cannot be server-rendered
 */
const CesiumViewerDynamic = dynamic(() => import('./CesiumViewerClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400 animate-pulse">Loading Globe...</div>
    </div>
  ),
}) as ComponentType<any>;

export default CesiumViewerDynamic;
