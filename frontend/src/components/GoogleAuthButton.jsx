import React, { useEffect, useRef } from "react";
import "../styles/login.css";

// Shared module-level state to guarantee google.accounts.id.initialize is called exactly once
let isGoogleIdentityInitialized = false;
let activeGoogleAuthCallbacks = null;

const initGoogleIdentityServices = (clientId) => {
  if (isGoogleIdentityInitialized || !window.google?.accounts?.id || !clientId) return;

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (response?.credential) {
        activeGoogleAuthCallbacks?.onCredential?.(response.credential);
      } else {
        activeGoogleAuthCallbacks?.onError?.(
          "Google did not return a credential. Please try again."
        );
      }
    },
    itp_support: true,
  });

  isGoogleIdentityInitialized = true;
};

const GoogleAuthButton = ({ onCredential, onError, disabled, label }) => {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const buttonRef = useRef(null);

  // Keep the active callbacks up to date
  useEffect(() => {
    activeGoogleAuthCallbacks = { onCredential, onError };
    return () => {
      if (activeGoogleAuthCallbacks?.onCredential === onCredential) {
        activeGoogleAuthCallbacks = null;
      }
    };
  }, [onCredential, onError]);

  useEffect(() => {
    if (!clientId || disabled) return undefined;

    let cancelled = false;

    const renderButton = () => {
      if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;

      // Ensure library is initialized once before rendering button
      initGoogleIdentityServices(clientId);

      const containerWidth =
        buttonRef.current?.parentElement?.clientWidth ||
        buttonRef.current?.clientWidth ||
        340;
      const targetWidth = Math.min(380, Math.max(200, Math.floor(containerWidth)));

      buttonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text: label === "Sign up with Google" ? "signup_with" : "continue_with",
        shape: "rectangular",
        width: targetWidth,
      });
    };

    let resizeTimer = null;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!cancelled && buttonRef.current && window.google?.accounts?.id) {
          const containerWidth =
            buttonRef.current?.parentElement?.clientWidth ||
            buttonRef.current?.clientWidth ||
            340;
          const targetWidth = Math.min(380, Math.max(200, Math.floor(containerWidth)));
          buttonRef.current.replaceChildren();
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: "outline",
            size: "large",
            text: label === "Sign up with Google" ? "signup_with" : "continue_with",
            shape: "rectangular",
            width: targetWidth,
          });
        }
      }, 150);
    };

    window.addEventListener("resize", handleResize);

    const existingScript = document.getElementById("google-identity-services");
    if (existingScript) {
      if (window.google?.accounts?.id) {
        renderButton();
      } else {
        existingScript.addEventListener("load", renderButton, { once: true });
      }
      return () => {
        cancelled = true;
        clearTimeout(resizeTimer);
        window.removeEventListener("resize", handleResize);
        existingScript.removeEventListener("load", renderButton);
      };
    }

    const script = document.createElement("script");
    script.id = "google-identity-services";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderButton;
    script.onerror = () =>
      onError?.("Google sign-in could not be loaded. Please try again.");
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      script.removeEventListener("load", renderButton);
    };
  }, [clientId, disabled, label, onError]);

  if (!clientId) {
    return (
      <button
        type="button"
        className="google-auth-button"
        disabled
        title="Google sign-in has not been configured"
      >
        <span aria-hidden="true">G</span> {label}
      </button>
    );
  }

  if (disabled) {
    return (
      <button type="button" className="google-auth-button" disabled>
        <span aria-hidden="true">G</span> Please wait…
      </button>
    );
  }

  return (
    <div className="google-auth-button-wrap" aria-disabled={disabled}>
      <div ref={buttonRef} />
    </div>
  );
};

export default GoogleAuthButton;
