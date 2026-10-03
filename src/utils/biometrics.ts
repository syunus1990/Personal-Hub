/**
 * WebAuthn & Biometric Authentication helper for Android / Browser
 */

export async function isBiometricsAvailable(): Promise<boolean> {
  if (
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  ) {
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (e) {
      console.warn('Biometrics check error:', e);
      return false;
    }
  }
  return false;
}

const BIOMETRIC_CRED_KEY = 'hub_biometric_cred_id_v1';

export async function registerBiometrics(): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false;

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Personal Hub', id: window.location.hostname },
        user: {
          id: userId,
          name: 'user@personalhub.local',
          displayName: 'Personal Hub Owner',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (credential && credential.rawId) {
      const credIdBase64 = btoa(
        String.fromCharCode(...new Uint8Array(credential.rawId))
      );
      localStorage.setItem(BIOMETRIC_CRED_KEY, credIdBase64);
      return true;
    }
  } catch (err: any) {
    console.warn('Biometric registration skipped or cancelled:', err?.message || err);
  }
  return false;
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false;

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const storedCredId = localStorage.getItem(BIOMETRIC_CRED_KEY);
    const allowCredentials = storedCredId
      ? [
          {
            id: Uint8Array.from(atob(storedCredId), (c) => c.charCodeAt(0)),
            type: 'public-key' as const,
            transports: ['internal' as const],
          },
        ]
      : undefined;

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials,
        userVerification: 'required',
        timeout: 60000,
      },
    });

    return !!assertion;
  } catch (err: any) {
    console.warn('Biometric authentication failed or cancelled:', err?.message || err);
    return false;
  }
}
