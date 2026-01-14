"use client";

import { useState, FormEvent } from "react";
import { User, Shield, ArrowRight, UserPlus, HelpCircle, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UsernameLoginCardProps {
  onLogin: (username: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function UsernameLoginCard({ onLogin, loading, error }: UsernameLoginCardProps) {
  const [username, setUsername] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateUsername = (value: string): string | null => {
    const trimmed = value.trim();

    if (!trimmed) {
      return "Username is required";
    }

    if (trimmed.length < 2 || trimmed.length > 30) {
      return "Username must be between 2 and 30 characters";
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
      return "Username can only contain letters, numbers, dots, underscores, and hyphens";
    }

    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmed = username.trim();
    const validationErr = validateUsername(trimmed);

    if (validationErr) {
      setValidationError(validationErr);
      return;
    }

    setValidationError(null);
    await onLogin(trimmed);
  };

  const handleCreateNew = async () => {
    const trimmed = username.trim();
    const validationErr = validateUsername(trimmed);

    if (validationErr) {
      setValidationError(validationErr);
      return;
    }

    setValidationError(null);
    await onLogin(trimmed);
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-md">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Enter your username to continue planning your adventures
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="text-gray-400 w-5 h-5" />
            </div>
            <Input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setValidationError(null);
              }}
              placeholder="Enter your username"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 input-focus transition outline-none"
              disabled={loading}
              aria-invalid={!!(validationError || error)}
              aria-describedby={validationError || error ? "username-error" : undefined}
            />
          </div>
          {(validationError || error) && (
            <p id="username-error" className="mt-2 text-sm text-red-600" role="alert">
              {validationError || error}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500 flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>No password required - username-only access</span>
          </p>
        </div>

        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
              <Shield className="text-white w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Secure & Simple</h4>
              <p className="text-xs text-gray-600">
                Your trips are securely stored and accessible only with your username. Perfect for
                quick access and collaboration.
              </p>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center space-x-2"
        >
          <span>{loading ? "Loading..." : "Continue to Dashboard"}</span>
          {!loading && <ArrowRight className="w-5 h-5" />}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 glass-panel text-gray-500">or</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleCreateNew}
          disabled={loading}
          variant="outline"
          className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 rounded-xl border-2 border-gray-200 transition flex items-center justify-center space-x-2"
        >
          <UserPlus className="w-5 h-5 text-indigo-600" />
          <span>Create New Account</span>
        </Button>
      </form>

      <div className="mt-6 sm:mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <a
            href="#"
            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-1"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Need help?</span>
          </a>
          <a href="#" className="text-gray-600 hover:text-gray-900 flex items-center space-x-1">
            <Book className="w-4 h-4" />
            <span>Documentation</span>
          </a>
        </div>
      </div>
    </div>
  );
}
