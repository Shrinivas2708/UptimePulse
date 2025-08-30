import { createFileRoute, useNavigate,Link, redirect } from '@tanstack/react-router'
import React from 'react';
import { toast } from 'sonner';
// import apiClient from '../lib/axios';
// import { Icon, Link } from 'lucide-react';
import { backend_url, Icon } from "../lib/exports";
import { useAuthStore } from '../store/useAuthStore';
import {apiClient} from '../lib/axios';

export const Route = createFileRoute('/signup')({
  beforeLoad:() => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({
        to:"/dashboard"
      });
    }
  },
  component: SignupComponent,
})

function SignupComponent() {
    const navigate = useNavigate();
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
  
  
    const handleSignup = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        // Call your backend's signup route
        await apiClient.post("/auth/register", { email, password ,name });
        toast.success("Account created successfully! Please log in.");
        navigate({ to: "/login" }); // Redirect to login after successful signup
      } catch (err) {
        toast.error("Signup failed. Please try again."); // Simplified for mock
        console.error(err);
      }
    };
  
    return (
      <div className="relative text-white min-h-screen flex flex-col max-w-screen-2xl mx-auto z-50">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 20% at 50% 0%, rgba(16, 185, 129, 0.25), transparent 70%), #0c0a09",
          }}
        />
        <main className="relative z-20 min-h-screen flex justify-center items-center">
          <section className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px] p-5">
            <div className="flex flex-col space-y-1 text-center items-center">
            <Link to="/">
            <img src={Icon} alt="" className="w-14 h-14" />
            </Link>
              <p className="text-xl font-semibold">Create an account</p>
              <p className="text-xs text-[#a1a1aa]">
                Enter your details below to get started
              </p>
            </div>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="flex flex-col gap-2">
              <input
                  type="text"
                  className="flex h-10 w-full bg-[#0c0a09] rounded-md border border-white/10 px-3 py-2 text-sm ring-offset-[#22c55e] placeholder:text-[#a1a1aa] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1"
                  placeholder="Name"
                  required
                  autoCorrect="off"
                  autoComplete="name"
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  type="email"
                  className="flex h-10 w-full bg-[#0c0a09] rounded-md border border-white/10 px-3 py-2 text-sm ring-offset-[#22c55e] placeholder:text-[#a1a1aa] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1"
                  placeholder="mail@example.com"
                  required
                  autoCorrect="off"
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                />
               
                 <input
                  type="password"
                  className="flex h-10 w-full bg-[#0c0a09] rounded-md border border-white/10 px-3 py-2 text-sm ring-offset-[#22c55e] placeholder:text-[#a1a1aa] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1"
                  placeholder="Confirm Password"
                  required
                  autoCorrect="off"
                  autoComplete="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit" className="w-full bg-[#22c55e] hover:bg-[#22c55e]/80 text-sm py-2 rounded-lg font-medium">
                  Register
                </button>
              </div>
            </form>
            <div className="relative">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0c0a09] px-4 text-white/50">
                  Or continue with
                </span>
              </div>
            </div>
            <a href={`${backend_url}/api/auth/google`} className="border rounded-lg border-white/10 py-1 flex justify-center items-center gap-2 hover:bg-[#292524] cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="25px" height="25px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
              <p className="text-sm">Sign Up with Google</p>
            </a>
            <div className="text-xs text-white/70 text-center max-w-sm px-10">
              By continuing, you agree to our <span className="hover:text-[#22c55e] underline cursor-pointer underline-offset-2">Terms of Service</span> and <span className="hover:text-[#22c55e] underline cursor-pointer underline-offset-2">Privacy Policy</span>
            </div>
          </section>
        </main>
      </div>
    );
  }
  
  
