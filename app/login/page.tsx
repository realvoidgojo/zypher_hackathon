"use client";
import { useState } from "react";
import { GoogleReCaptcha } from "@/components/GoogleReCaptcha";
import { supabase } from "@/services/supabaseClient";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");

  // reCAPTCHA state
  const [recaptchaError, setRecaptchaError] = useState("");

  async function verifyCaptchaToken(token: string) {
    const res = await fetch("/api/turnstile/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.success);
  }

  // 1. LOGIN LOGIC
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setRecaptchaError("");
    // @ts-ignore
    const recaptchaResponse = window.grecaptcha?.getResponse();
    if (!recaptchaResponse) {
      setRecaptchaError("Please complete the verification challenge.");
      return;
    }

    const captchaOk = await verifyCaptchaToken(recaptchaResponse);
    if (!captchaOk) {
      setRecaptchaError("Verification failed. Please try again.");
      // @ts-ignore
      window.grecaptcha?.reset();
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !data) {
      alert("Authentication Failed: Invalid credentials.");
      setLoading(false);
    } else {
      localStorage.setItem("supplier_id", data.owner_id);
      localStorage.setItem("supplier_name", data.name);
      window.location.href = "/dashboard";
    }
    // @ts-ignore
    window.grecaptcha?.reset();
  }

  // 2. SIGN UP LOGIC (Simplified: No Setup Wizard)
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setRecaptchaError("");
    // @ts-ignore
    const recaptchaResponse = window.grecaptcha?.getResponse();
    if (!recaptchaResponse) {
      setRecaptchaError("Please complete the verification challenge.");
      return;
    }

    const captchaOk = await verifyCaptchaToken(recaptchaResponse);
    if (!captchaOk) {
      setRecaptchaError("Verification failed. Please try again.");
      // @ts-ignore
      window.grecaptcha?.reset();
      return;
    }

    setLoading(true);

    const ownerId = crypto.randomUUID();

    const { error } = await supabase.from("suppliers").insert({
      name: company,
      email: email,
      password: password,
      owner_id: ownerId,
      reliability_score: 1.0,
    });

    if (error) {
      alert("Sign up failed: " + error.message);
      setLoading(false);
    } else {
      localStorage.setItem("supplier_id", ownerId);
      localStorage.setItem("supplier_name", company);
      window.location.href = "/dashboard";
    }
    // @ts-ignore
    window.grecaptcha?.reset();
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#3B82F6]/30 selection:text-[#F9FAFB]">
      {/* LOGIN CARD */}
      <div className="bg-[#111827] p-10 rounded-2xl w-full max-w-md shadow-sm border border-[#1F2937] relative z-10 animate-fade-in-up">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-semibold mb-2 text-[#F9FAFB]">Zypher</h1>
          <p className="text-sm font-medium text-[#9CA3AF]">
            {isNewUser ? "Create an account" : "Sign in to your account"}
          </p>
        </div>

        <form
          onSubmit={isNewUser ? handleSignUp : handleLogin}
          className="space-y-5"
        >
          {isNewUser && (
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-[#9CA3AF] ml-1">
                Company Name
              </label>
              <input
                type="text"
                placeholder="e.g., Acme Corp"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full p-3 bg-[#0B0F14] border border-[#1F2937] rounded-lg text-[#F9FAFB] placeholder-[#4B5563] focus:border-[#3B82F6] outline-none transition-all text-sm font-medium"
              />
            </div>
          )}

          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-[#9CA3AF] ml-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-[#0B0F14] border border-[#1F2937] rounded-lg text-[#F9FAFB] placeholder-[#4B5563] focus:border-[#3B82F6] outline-none transition-all text-sm font-medium"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-[#9CA3AF] ml-1">
              Password
            </label>
            <div className="flex items-center rounded-lg border border-[#1F2937] bg-[#0B0F14] px-3 transition-all focus-within:border-[#3B82F6]">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent py-3 text-sm font-medium text-[#F9FAFB] placeholder-[#4B5563] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="ml-3 text-[#9CA3AF] transition-colors hover:text-[#F9FAFB]"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Google reCAPTCHA - moved below password */}
          <div className="space-y-1 text-left flex flex-col items-center">
            <GoogleReCaptcha />
            {recaptchaError && (
              <div className="text-xs text-red-500 mt-1">{recaptchaError}</div>
            )}
          </div>

          <button
            disabled={loading}
            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white py-3 rounded-lg font-semibold text-sm transition-all shadow-sm active:translate-y-px disabled:opacity-50 mt-4 flex justify-center items-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                Authenticating...
              </>
            ) : isNewUser ? (
              "Sign Up"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <button
          onClick={() => setIsNewUser(!isNewUser)}
          className="mt-6 text-[#9CA3AF] font-medium w-full text-center text-sm hover:text-[#F9FAFB] transition-colors"
        >
          {isNewUser
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"}
        </button>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
      `,
        }}
      />
    </div>
  );
}
