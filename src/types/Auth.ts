export type User = {
	id: number;
	username: string;
};

export type LoginInput = {
	username: string;
	password: string;
};

export type SignupInput = LoginInput & {
	password_confirm: string;
};

export type AuthResponse = {
	token: string;
	user: User;
};
