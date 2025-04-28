// app/home/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SignOutButton from "../components/signout";
import Image from "next/image";

export default async function HomePage() {
  const session = await auth();
  
  // Redirect if no session
  if (!session) {
    redirect("/");
  }
  
  return (
    <div>
      <h1>Welcome Home</h1>
      <p>You are logged in as: {session.user?.name || 'User'}</p>
      {session.user?.image ? (
        <Image         
          src={session.user.image}         
          alt="Profile picture"         
          width={100}         
          height={100}
          className="rounded-full mb-4"
        />
      ) : (
        <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
          <span className="text-gray-500 text-2xl">
            {session.user?.name?.[0] || 'U'}
          </span>
        </div>
      )}   
      <SignOutButton></SignOutButton>
    </div>
  );
}