import type { Order } from "../types/Order";

export const getOrders = async (): Promise<Order[]> => {
	const response = await fetch("/api/orders");

	if (!response.ok) {
		throw new Error("Could not load data: orders");
	}

	return response.json() as Promise<Order[]>;
};
