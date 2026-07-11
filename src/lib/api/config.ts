/** NestJS API base URL (required). */
export function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }
  return url.replace(/\/$/, '');
}
