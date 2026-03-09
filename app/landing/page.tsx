"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const team = [
  {
    name: "Manoj V",
    role: "Team Leader",
    github: "SPARKY-manoj",
    url: "https://github.com/SPARKY-manoj",
  },
  {
    name: "Sohil Lochan V",
    role: "Core / Backend Developer",
    github: "Sohil-Magixz",
    url: "https://github.com/Sohil-Magixz",
  },
  {
    name: "Harish S",
    role: "Frontend Developer",
    github: "realvoidgojo",
    url: "https://github.com/realvoidgojo",
  },
];

const features = [
  {
    title: "Real-time Inventory Tracking",
    desc: "Monitor stock levels across all warehouses with live Supabase subscriptions.",
  },
  {
    title: "Shipment Management",
    desc: "Create, track, and manage shipments with live map visualization and driver assignment.",
  },
  {
    title: "AI Demand Forecasting",
    desc: "Python ML service that predicts demand based on historical shipment data.",
  },
  {
    title: "Procurement Automation",
    desc: "Auto-generates purchase orders when stock falls below reorder thresholds.",
  },
  {
    title: "Supplier Analytics",
    desc: "Track supplier reliability scores and flag high-risk vendors.",
  },
  {
    title: "Demand Heatmap",
    desc: "Visual stock distribution matrix across warehouses and products.",
  },
  {
    title: "Simulation Suite",
    desc: "Stress-test supply chain resilience against demand spikes and delays.",
  },
  {
    title: "AI Chat Assistant",
    desc: "Conversational AI agent for forecast analysis and supply chain queries.",
  },
];

const techStack = [
  { name: "Next.js 15", category: "Frontend" },
  { name: "TypeScript", category: "Frontend" },
  { name: "Tailwind CSS v4", category: "Frontend" },
  { name: "Recharts", category: "Charts" },
  { name: "Leaflet", category: "Maps" },
  { name: "Supabase", category: "Backend" },
  { name: "Python", category: "ML Service" },
  { name: "Prophet", category: "ML Service" },
  { name: "FastAPI", category: "ML Service" },
];

export default function LandingPage() {
  const [starCount, setStarCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/repos/realvoidgojo/zypher_hackathon")
      .then((r) => r.json())
      .then((d) => {
        if (d.stargazers_count !== undefined) setStarCount(d.stargazers_count);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E5E7EB] selection:bg-[#3B82F6]/30 selection:text-white">
      {/* ─── TOP NAV ─── */}
      <header className="sticky top-0 z-50 bg-[#0B0F14]/80 backdrop-blur-md border-b border-[#1F2937]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-base font-semibold text-[#F9FAFB] tracking-tight">
            Zypher
          </span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/realvoidgojo/zypher_hackathon"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors text-sm font-medium flex items-center gap-1.5"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
            <Link
              href="/login"
              className="bg-[#F9FAFB] text-[#0B0F14] px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-white transition-colors"
            >
              Portal →
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
            🏆 Hackathon Winner
          </span>
          <span className="text-xs font-medium text-[#6B7280]">
            Built in 24 hours
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-[#F9FAFB] leading-tight tracking-tight max-w-2xl">
          Zypher
        </h1>
        <p className="text-lg text-[#9CA3AF] mt-4 max-w-2xl leading-relaxed font-medium">
          An open-source supply chain management platform. Real-time inventory
          tracking, AI demand forecasting, shipment management, and procurement
          automation — all in one dashboard.
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-8">
          <a
            href="https://github.com/realvoidgojo/zypher_hackathon"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#1F2937] text-[#F9FAFB] px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#374151] transition-colors border border-[#374151]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            View on GitHub
            {starCount !== null && (
              <span className="ml-1 text-[#9CA3AF]">· ⭐ {starCount}</span>
            )}
          </a>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-[#3B82F6] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#2563EB] transition-colors"
          >
            Open Portal →
          </Link>
        </div>
      </section>

      <hr className="border-[#1F2937] max-w-5xl mx-auto" />

      {/* ─── ABOUT ─── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-[#F9FAFB] mb-4">
          What is Zypher?
        </h2>
        <div className="text-[#9CA3AF] space-y-4 text-sm leading-relaxed max-w-3xl">
          <p>
            Zypher is a full-stack supply chain management platform built during
            a <strong className="text-[#F9FAFB]">24-hour hackathon</strong>{" "}
            where the team won the title. It&apos;s not a toy project — it
            connects to a real Supabase database, runs a Python ML service for
            demand prediction, and handles real-time inventory updates with
            Postgres subscriptions.
          </p>
          <p>
            The frontend is Next.js 15 with Tailwind CSS. The backend is
            Supabase (Postgres + Realtime). There&apos;s a separate Python
            FastAPI service that runs Prophet and scikit-learn models for demand
            forecasting and delay prediction. Everything talks to each other. No
            mock data in production.
          </p>
          <p>
            It&apos;s open source. If you want to contribute, just fork it and
            open a PR. We&apos;re looking for contributors across the stack —
            frontend, backend, ML, docs, whatever. If you ship something useful,
            you become a project contributor.
          </p>
        </div>
      </section>

      <hr className="border-[#1F2937] max-w-5xl mx-auto" />

      {/* ─── FEATURES ─── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-[#F9FAFB] mb-2">Features</h2>
        <p className="text-sm text-[#6B7280] mb-8">
          What you get out of the box.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="border border-[#1F2937] rounded-lg p-4 hover:border-[#374151] transition-colors"
            >
              <h3 className="text-sm font-semibold text-[#F9FAFB] mb-1">
                {f.title}
              </h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-[#1F2937] max-w-5xl mx-auto" />

      {/* ─── TECH STACK ─── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-[#F9FAFB] mb-2">Tech Stack</h2>
        <p className="text-sm text-[#6B7280] mb-8">
          No magic. Just solid tools.
        </p>
        <div className="flex flex-wrap gap-2">
          {techStack.map((t) => (
            <span
              key={t.name}
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-[#1F2937] text-[#D1D5DB] border border-[#374151]"
            >
              {t.name}{" "}
              <span className="text-[#6B7280] ml-1">· {t.category}</span>
            </span>
          ))}
        </div>
      </section>

      <hr className="border-[#1F2937] max-w-5xl mx-auto" />

      {/* ─── TEAM ─── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-[#F9FAFB] mb-2">Team</h2>
        <p className="text-sm text-[#6B7280] mb-8">
          The people who built this in 24 hours.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {team.map((member) => (
            <a
              key={member.github}
              href={member.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#1F2937] rounded-lg p-5 hover:border-[#374151] transition-colors group flex flex-col items-center text-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://github.com/${member.github}.png?size=120`}
                alt={member.name}
                width={64}
                height={64}
                className="rounded-full border-2 border-[#1F2937] group-hover:border-[#374151] transition-colors mb-3"
              />
              <p className="text-sm font-semibold text-[#F9FAFB]">
                {member.name}
              </p>
              <p className="text-xs text-[#3B82F6] font-medium mt-0.5">
                {member.role}
              </p>
              <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                @{member.github}
              </p>
            </a>
          ))}
        </div>
      </section>

      <hr className="border-[#1F2937] max-w-5xl mx-auto" />

      {/* ─── CONTRIBUTE ─── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-[#F9FAFB] mb-4">Contribute</h2>
        <div className="text-[#9CA3AF] space-y-4 text-sm leading-relaxed max-w-3xl">
          <p>
            This is an open-source project. We accept contributions of all kinds
            — bug fixes, new features, documentation improvements, UI tweaks, ML
            model improvements, whatever.
          </p>
          <p>
            The bar is simple:{" "}
            <strong className="text-[#F9FAFB]">
              if your PR ships value, you&apos;re a contributor.
            </strong>{" "}
            Your name and avatar show up in the repo. No gatekeeping.
          </p>
        </div>

        <div className="mt-6 bg-[#111827] border border-[#1F2937] rounded-lg p-4 max-w-lg font-mono text-sm overflow-x-auto">
          <p className="text-[#6B7280] mb-1 whitespace-nowrap"># clone and get started</p>
          <p className="text-[#D1D5DB] whitespace-nowrap">
            git clone https://github.com/realvoidgojo/zypher_hackathon.git
          </p>
          <p className="text-[#D1D5DB] whitespace-nowrap">cd zypher_hackathon</p>
          <p className="text-[#D1D5DB] whitespace-nowrap">npm install</p>
          <p className="text-[#D1D5DB] whitespace-nowrap">npm run dev</p>
        </div>

        <div className="mt-6">
          <a
            href="https://github.com/realvoidgojo/zypher_hackathon/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
          >
            View open issues →
          </a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[#1F2937] mt-8">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6B7280]">
            Zypher — Built with ☕ in 24 hours. Open source under MIT.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/realvoidgojo/zypher_hackathon"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
            >
              GitHub
            </a>
            <Link
              href="/login"
              className="text-xs text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
            >
              Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
