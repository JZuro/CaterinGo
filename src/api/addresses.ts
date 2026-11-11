import type { Address, AddressInput } from "../types/Address";

export const getAddresses = async (): Promise<Address[]> => {
	const response = await fetch("/api/addresses");

	if (!response.ok) {
		throw new Error("Could not load data: addresses");
	}

	return response.json() as Promise<Address[]>;
};

export const createAddress = async (
	address: AddressInput,
): Promise<Address> => {
	const response = await fetch("/api/addresses", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(address),
	});

	if (!response.ok) {
		throw new Error("Could not create address");
	}

	return response.json() as Promise<Address>;
};

export const updateAddress = async (
	id: number,
	address: AddressInput
): Promise<Address> => {
	const response = await fetch(`/api/addresses/${id}`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(address),
	});

	if (!response.ok) {
		throw new Error("Could not update address");
	}

	return response.json() as Promise<Address>;
};

export const deleteAddress = async (id: number): Promise<void> => {
	const response = await fetch(`/api/addresses/${id}`, {
		method: "DELETE",
	});

	if (!response.ok) {
		throw new Error("Could not delete address");
	}
};