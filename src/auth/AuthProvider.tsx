import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
	getCurrentUser,
	login as requestLogin,
	logout as requestLogout,
	signup as requestSignup,
} from "../api/auth";
import {
	clearStoredToken,
	getStoredToken,
	storeToken,
} from "../api/client";
import type { LoginInput, SignupInput, User } from "../types/Auth";
import { AuthContext } from "./authContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const queryClient = useQueryClient();
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const clearSession = () => {
			queryClient.clear();
			setUser(null);
		};
		window.addEventListener("auth:unauthorized", clearSession);

		const restoreSession = async () => {
			if (!getStoredToken()) {
				setLoading(false);
				return;
			}

			try {
				setUser(await getCurrentUser());
			} catch {
				clearStoredToken();
			} finally {
				setLoading(false);
			}
		};

		void restoreSession();

		return () => window.removeEventListener("auth:unauthorized", clearSession);
	}, [queryClient]);

	const applyAuthentication = (token: string, authenticatedUser: User) => {
		queryClient.clear();
		storeToken(token);
		setUser(authenticatedUser);
	};

	const login = async (input: LoginInput) => {
		const response = await requestLogin(input);
		applyAuthentication(response.token, response.user);
	};

	const signup = async (input: SignupInput) => {
		const response = await requestSignup(input);
		applyAuthentication(response.token, response.user);
	};

	const logout = async () => {
		try {
			await requestLogout();
		} finally {
			clearStoredToken();
			queryClient.clear();
			setUser(null);
		}
	};

	return (
		<AuthContext value={{ user, loading, login, signup, logout }}>
			{children}
		</AuthContext>
	);
};
