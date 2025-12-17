import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import LoginForm from "@/components/LoginForm";
import { api } from "@/lib/api";

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      api.auth.login(username, password),
    onSuccess: (data: any) => {
      onLogin(data.user);
    },
    onError: (error: any) => {
      setError(error.message || "Login failed. Please try again.");
    }
  });

  const handleLogin = async (username: string, password: string) => {
    setError("");
    loginMutation.mutate({ username, password });
  };

  return (
    <LoginForm
      onLogin={handleLogin}
      isLoading={loginMutation.isPending}
      error={error}
    />
  );
}