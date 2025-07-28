import React from 'react';
import { type BuildTimeData } from './buildTimeData';
import { readFileSync } from 'fs';
import { join } from 'path';

let cachedBuildData: BuildTimeData | null = null;

/**
 * Loads the build-time contract data from the public directory
 * This data is generated at build time and cached for runtime use
 */
export async function loadBuildTimeData(): Promise<BuildTimeData> {
  if (cachedBuildData) {
    return cachedBuildData;
  }

  try {
    const response = await fetch('/build-data.json');
    if (!response.ok) {
      throw new Error(`Failed to load build data: ${response.status}`);
    }
    
    const data = await response.json() as BuildTimeData;
    cachedBuildData = data;
    return data;
  } catch (error) {
    console.error('Failed to load build-time data:', error);
    throw new Error('Build-time contract data not available. Ensure the build process completed successfully.');
  }
}

/**
 * Synchronously loads build-time data for server-side usage
 * This should only be used in server components or API routes
 */
export function loadBuildTimeDataSync(): BuildTimeData {
  try {
    const filePath = join(process.cwd(), 'public', 'build-data.json');
    const fileContents = readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents) as BuildTimeData;
  } catch (error) {
    console.error('Failed to load build-time data synchronously:', error);
    throw new Error('Build-time contract data not available. Ensure the build process completed successfully.');
  }
}

/**
 * Hook for loading build-time data in React components
 */
export function useBuildTimeData() {
  const [data, setData] = React.useState<BuildTimeData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    loadBuildTimeData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
