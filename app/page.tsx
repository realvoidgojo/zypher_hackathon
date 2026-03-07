"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    // Layout handles the redirect priority based on auth state,
    // but as a fallback for the root route itself:
    const sid = localStorage.getItem("supplier_id")
    if (sid) router.replace("/dashboard")
    else router.replace("/login")
  }, [router])
  return null
}
