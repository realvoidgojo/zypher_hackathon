"use client"
import { useState } from "react"
import { supabase } from "@/services/supabaseClient"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [isNewUser, setIsNewUser] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [company, setCompany] = useState("")

  const router = useRouter()

  // 1. LOGIN LOGIC
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single()

    if (error || !data) {
      alert("Authentication Failed: Invalid credentials.")
      setLoading(false)
    } else {
      localStorage.setItem("supplier_id", data.owner_id) 
      localStorage.setItem("supplier_name", data.name)
      window.location.href = "/dashboard" 
    }
  }

  // 2. SIGN UP LOGIC (Simplified: No Setup Wizard)
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const ownerId = crypto.randomUUID()

    const { error } = await supabase.from('suppliers').insert({ 
      name: company, 
      email: email,
      password: password,
      owner_id: ownerId,
      reliability_score: 1.0 
    })

    if (error) {
      alert("Node Initialization failed: " + error.message)
      setLoading(false)
    } else {
      localStorage.setItem("supplier_id", ownerId)
      localStorage.setItem("supplier_name", company)
      window.location.href = "/dashboard" 
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-900">
      
      {/* 🌌 AMBIENT BACKGROUND GLOWS */}
      <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>

      {/* 🔐 TERMINAL CARD */}
      <div className="bg-[#0f1423]/80 backdrop-blur-2xl p-10 rounded-[2.5rem] w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 relative z-10 animate-fade-in-up">
        
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            ZYPHER
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">
            {isNewUser ? "Initialize Network Node" : "Terminal Access"}
          </p>
        </div>
        
        <form onSubmit={isNewUser ? handleSignUp : handleLogin} className="space-y-5">
          {isNewUser && (
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest ml-2">Node Designation</label>
              <input 
                type="text" 
                placeholder="e.g., Chennai Logistics Hub" 
                required 
                value={company} 
                onChange={e => setCompany(e.target.value)} 
                className="w-full p-4 bg-[#161b2a] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:border-cyan-500/50 outline-none transition-all text-sm font-medium shadow-inner" 
              />
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest ml-2">Operator Identity</label>
            <input 
              type="email" 
              placeholder="operator@zypher.network" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full p-4 bg-[#161b2a] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:border-cyan-500/50 outline-none transition-all text-sm font-medium shadow-inner" 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest ml-2">Security Key</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full p-4 bg-[#161b2a] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:border-cyan-500/50 outline-none transition-all text-sm font-medium shadow-inner" 
            />
          </div>
          
          <button 
            disabled={loading} 
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] active:scale-95 disabled:opacity-50 mt-4 flex justify-center items-center gap-3"
          >
            {loading ? (
                <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Authenticating...
                </>
            ) : isNewUser ? "Deploy Node" : "Access Network"}
          </button>
        </form>

        <button 
            onClick={() => setIsNewUser(!isNewUser)} 
            className="mt-8 text-slate-400 font-medium w-full text-center text-xs hover:text-cyan-400 transition-colors"
        >
          {isNewUser ? "Already a verified node? Authenticate" : "New logistics operator? Request Access"}
        </button>

        <div className="mt-10 pt-6 border-t border-white/5 text-center">
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">
                Engineered by <span className="text-cyan-500/70">Team RoarX</span>
            </p>
        </div>
      </div>

      {/* Required for the entrance animation if not globally defined */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
      `}} />
    </div>
  )
}