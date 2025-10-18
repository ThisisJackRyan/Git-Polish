"use client";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { signInWithGitHub } from "../app/services/firebase";

export default function AuthButton() {
  const { setUser, setToken } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const { user, token } = await signInWithGitHub();

      // Save user + token in context
      setUser(user);
      setToken(token);

      // Optional: also save token in sessionStorage for page refresh
      sessionStorage.setItem("githubToken", token);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("GitHub sign-in failed:", err);
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
    >
      Sign in with GitHub
    </button>
  );
}

