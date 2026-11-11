const tokenKey = "cateringo-token";
let memoryToken: string | null = null;

export const getStoredToken = () => {
	try {
		return window.localStorage.getItem(tokenKey) ?? memoryToken;
	} catch {
		return memoryToken;
	}
};

export const storeToken = (token: string) => {
	memoryToken = token;

	try {
		window.localStorage.setItem(tokenKey, token);
	} catch {
		// The current tab can still use the in-memory token.
	}
};

export const clearStoredToken = () => {
	memoryToken = null;

	try {
		window.localStorage.removeItem(tokenKey);
	} catch {
		// There may be no persistent storage to clear.
	}
};

export const apiFetch = async (
	input: RequestInfo | URL,
	init: RequestInit = {},
) => {
	const headers = new Headers(init.headers);
	const token = getStoredToken();

	if (token) {
		headers.set("Authorization", `Token ${token}`);
	}

	const response = await fetch(input, { ...init, headers });

	if (response.status === 401) {
		clearStoredToken();
		window.dispatchEvent(new Event("auth:unauthorized"));
	}

	return response;
};
