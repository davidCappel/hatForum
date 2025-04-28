"use client"
import { signIn } from "next-auth/react"
 
export default function SignInButton() {
  return (
    <button
      onClick={() => signIn("google", {callbackUrl: "/home"})}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      Sign In with Google
    </button>
  )
} 