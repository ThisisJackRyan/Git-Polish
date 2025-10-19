"use client";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { signInWithGitHub, signOutUser } from "../app/services/firebase";

export default function AuthButton() {
  const { user, setUser, setToken, signOut, mounted } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const { user, token } = await signInWithGitHub();

      // Save user + token in context
      setUser(user);
      setToken(token);

      // Save token and user in sessionStorage for page refresh
      sessionStorage.setItem("githubToken", token);
      sessionStorage.setItem("githubUser", JSON.stringify(user));

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("GitHub sign-in failed:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      signOut();
      router.push("/");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="w-32 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
    );
  }

  // If user is signed in, show sign out button
  if (user) {
    return (
      <button
        onClick={handleSignOut}
        className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 border border-gray-300 dark:border-gray-600"
      >
        Sign Out
      </button>
    );
  }

  // If user is not signed in, show sign in button
  return (
    <button
      onClick={handleLogin}
      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
    >
      Sign in with GitHub
    </button>
  );
}

