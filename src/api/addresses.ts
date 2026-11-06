import type { Address } from "../types/Address";

export const getAddresses = async (): Promise<Address[]> => {
	const response = await fetch("/api/addresses");

	if (!response.ok) {
		throw new Error("Could not load data: addresses");
	}

	return response.json() as Promise<Address[]>;
};
