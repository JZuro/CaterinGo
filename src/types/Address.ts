export type AddressInput = {
	street: string;
	apartment: string;
	city: string;
	postal_code: string;
};

export type Address = AddressInput & {
	id: number;
	latitude: string | null;
	longitude: string | null;
};
