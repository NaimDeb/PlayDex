"use client";

import { useAuth } from "@/providers/AuthProvider";
import { LoginFormData } from "@/types/authType";
import { FormEvent, useState } from "react";

export default function LoginPage() {
    const [isLoginForm, setIsLoginForm] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [rememberMe, setRememberMe] = useState(false);


    const { login, register, error } = useAuth()

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Is login form

        if (isLoginForm) {
        const loginData: LoginFormData = {
            email,
            password,
            rememberMe
        }
        await login(loginData)
    } else {
        const registerData = {
            email,
            password,
            username
        }
        await register(registerData)
    }
};




  return (
    <>
            <div className="bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-xl w-full max-w-lg mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-white mb-6">
                {isLoginForm ? "connection" : "Inscription"}
            </h1>

            {error && (
                <div className="bg-red-600/20 border border-red-600 text-red-100 px-3 py-2 sm:px-4 sm:py-3 rounded-lg mb-4 sm:mb-6 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Email */}
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-300 mb-1"
                    >
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                    />
                </div>

                {/* Password */}
                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-300 mb-1"
                    >
                        Mot de passe
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                    />
                </div>

                {/* Pseudo */}
                {!isLoginForm && (
                    <div>
                        <label
                            htmlFor="pseudo"
                            className="block text-sm font-medium text-gray-300 mb-1"
                        >
                            Pseudo
                        </label>
                        <input
                            id="pseudo"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                        />
                    </div>
                )}

                {/* Remember Me */}
                {isLoginForm && (
                    <div className="flex items-center">
                        <input
                            id="rememberMe"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <label
                            htmlFor="rememberMe"
                            className="ml-2 block text-sm text-gray-300"
                        >
                            Se souvenir de moi
                        </label>
                    </div>
                )}

                <div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
                    >
                        {isLoginForm
                            ? "Se connecter"
                            : "S'inscrire"}
                    </button>
                </div>

                <div className="text-center text-sm text-gray-400">
                    {isLoginForm ? (
                        <>
                            Pas encore de compte ?{" "}
                            <button
                                type="button"
                                onClick={() => setIsLoginForm(false)}
                                className="text-blue-500 hover:text-blue-400 font-medium"
                            >
                                S&apos;inscrire
                            </button>
                        </>
                    ) : (
                        <>
                            Déjà un compte ?{" "}
                            <button
                                type="button"
                                onClick={() => setIsLoginForm(true)}
                                className="text-blue-500 hover:text-blue-400 font-medium"
                            >
                                Se connecter
                            </button>
                        </>
                    )}
                </div>
            </form>
        </div>
    </>
  );
}