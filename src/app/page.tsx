import Image from "next/image";
import SignInButton from "./components/signin";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-6">
          <Image 
            src="/hat-logo.png" 
            alt="Hat Forum Logo" 
            width={150} 
            height={150}
            className="mx-auto"
            priority
          />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
          Welcome to Hat Forum
        </h1>
        
        <p className="text-xl mb-8 text-gray-700 dark:text-gray-300">
          A community for hat enthusiasts to share, discuss, and explore the world of hats
        </p>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Join Our Hat Community
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-700 p-4 rounded-md shadow">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Share</h3>
              <p className="text-gray-700 dark:text-gray-300">Post photos and stories about your favorite hats</p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-4 rounded-md shadow">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Discover</h3>
              <p className="text-gray-700 dark:text-gray-300">Find new hat styles and where to purchase them</p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-4 rounded-md shadow">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Connect</h3>
              <p className="text-gray-700 dark:text-gray-300">Engage with fellow hat enthusiasts in discussions</p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <SignInButton />
          </div>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Sign in to continue to the Hat Forum. We use Google Authentication to keep your account secure.</p>
        </div>
      </div>
    </div>
  );
}