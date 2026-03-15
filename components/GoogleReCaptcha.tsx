import Script from "next/script";

export function GoogleReCaptcha() {
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?compat=recaptcha"
        strategy="afterInteractive"
      />
      <div
        className="g-recaptcha"
        data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      ></div>
    </>
  );
}
