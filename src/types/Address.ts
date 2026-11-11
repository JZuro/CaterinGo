export type Address = {
	id: number;
	street: string;
	apartment: string;
	city: string;
	postal_code: string;
};

export type AddressInput = Omit<Address, "id">;
