import { PageLoadingIndicator } from '@/components/PageLoadingIndicator';

/** OAuth callback route — Google redirects the auth popup/tab here after sign-in. */
export default function OAuthRedirectScreen() {
  return (
    <PageLoadingIndicator
      message="Signing you in…"
      description="This window should close automatically."
      className="flex-1 items-center justify-center bg-background"
    />
  );
}
