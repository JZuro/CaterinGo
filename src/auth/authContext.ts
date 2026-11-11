import { createContext } from "react";
import type { LoginInput, SignupInput, User } from "../types/Auth";

export type AuthContextValue = {
	user: User | null;
	loading: boolean;
	login: (input: LoginInput) => Promise<void>;
	signup: (input: SignupInput) => Promise<void>;
	logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
