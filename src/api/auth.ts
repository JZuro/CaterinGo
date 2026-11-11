import type {
	AuthResponse,
	LoginInput,
	SignupInput,
	User,
} from "../types/Auth";
import { apiFetch } from "./client";

const getErrorMessage = async (response: Response) => {
	try {
		const data = (await response.json()) as Record<string, unknown>;
		const firstError = Object.values(data)[0];

		if (typeof firstError === "string") {
			return firstError;
		}

		if (Array.isArray(firstError) && typeof firstError[0] === "string") {
			return firstError[0];
		}
	} catch {
		// Use the fallback below when the server did not return JSON.
	}

	return "Could not complete the request";
};

const submitCredentials = async (
	path: string,
	input: LoginInput | SignupInput,
) => {
	const response = await fetch(path, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});

	if (!response.ok) {
		throw new Error(await getErrorMessage(response));
	}

	return response.json() as Promise<AuthResponse>;
};

export const login = (input: LoginInput) =>
	submitCredentials("/api/auth/login/", input);

export const signup = (input: SignupInput) =>
	submitCredentials("/api/auth/signup/", input);

export const getCurrentUser = async (): Promise<User> => {
	const response = await apiFetch("/api/auth/me/");

	if (!response.ok) {
		throw new Error("Could not restore session");
	}

	return response.json() as Promise<User>;
};

export const logout = async () => {
	const response = await apiFetch("/api/auth/logout/", { method: "POST" });

	if (!response.ok && response.status !== 401) {
		throw new Error("Could not log out");
	}
};
