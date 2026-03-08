import { ShieldCheck } from "lucide-react";

interface Props {
  onUnlock: () => void;
}

export default function SecureVaultAccess({ onUnlock }: Props) {

    const checkBiometrics = async () => {

    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

        if (!available) {
            alert(
            "Your device does not have Windows Hello set up. Please enable a device PIN or fingerprint in Windows settings."
            );
            return false;
        }

        return true;
    };
  const registerBiometric = async () => {
    try {

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "Cognify Vault"
          },
          user: {
            id: userId,
            name: "vault-user",
            displayName: "Vault User"
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 }
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "none"
        }
      }) as PublicKeyCredential;

      // Save credential ID
      const id = btoa(
        String.fromCharCode(...new Uint8Array(credential.rawId))
      );

      localStorage.setItem("vaultCredentialId", id);

      alert("Biometric authentication registered!");

    } catch (err) {
      console.error(err);
      alert("Biometric registration failed");
    }
  };


  const unlockWithBiometrics = async () => {
    try {

      if (!window.PublicKeyCredential) {
        alert("Biometric authentication not supported.");
        return;
      }

      const storedId = localStorage.getItem("vaultCredentialId");

      // If not registered yet → register first
      if (!storedId) {
        await registerBiometric();
        return;
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credentialId = Uint8Array.from(
        atob(storedId),
        c => c.charCodeAt(0)
      );

      const publicKey: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        userVerification: "required",
        allowCredentials: [
          {
            id: credentialId,
            type: "public-key",
            transports: ["internal"]
          }
        ]
      };

      await navigator.credentials.get({ publicKey });

      onUnlock();

    } catch (error) {
      console.error("Authentication failed:", error);
      alert("Authentication failed.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-main-bg text-foreground">

      <div className="flex-1 flex items-center justify-center px-6">

        <div className="w-full max-w-lg rounded-2xl border border-card-border bg-card-bg shadow-sm p-8 space-y-6">

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShieldCheck size={20} className="text-primary" />
            </div>

            <h2 className="text-lg font-semibold tracking-tight">
              Secure Vault Access
            </h2>
          </div>

          <p className="text-sm text-muted-foreground">
            Use your device authentication (Fingerprint or Device PIN) to unlock the secure vault.
          </p>

          <button
            onClick={unlockWithBiometrics}
            className="w-full py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:opacity-90"
          >
            Unlock with Biometrics
          </button>

        </div>

      </div>

    </div>
  );
}