import React, { useEffect, useRef } from "react";
import "../styles/login.css";

const GoogleAuthButton = ({ onCredential, onError, disabled, label }) => {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!clientId || disabled) return undefined;

    let cancelled = false;
    const renderButton = () => {
      if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          if (credential) onCredential(credential);
          else onError("Google did not return a credential. Please try again.");
        },
      });
      buttonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text: label === "Sign up with Google" ? "signup_with" : "continue_with",
        shape: "rectangular",
        width: 360,
      });
    };

    const existingScript = document.getElementById("google-identity-services");
    if (existingScript) {
      if (window.google?.accounts?.id) renderButton();
      else existingScript.addEventListener("load", renderButton, { once: true });
      return () => {
        cancelled = true;
        existingScript.removeEventListener("load", renderButton);
      };
    }

    const script = document.createElement("script");
    script.id = "google-identity-services";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderButton;
    script.onerror = () => onError("Google sign-in could not be loaded. Please try again.");
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener("load", renderButton);
    };
  }, [clientId, disabled, label, onCredential, onError]);

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
