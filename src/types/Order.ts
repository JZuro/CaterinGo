export type OrderStatus = "pending" | "delivered" | "cancelled";

export type OrderItem = {
	meal: {
		id: number;
		name: string;
	};
	quantity: number;
};

export type Order = {
	id: number;
	status: OrderStatus;

	address: {
		id: number;
		street: string;
	};

	items: OrderItem[];
};
