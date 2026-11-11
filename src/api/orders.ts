import type { Order, OrderInput } from "../types/Order";
import { apiFetch } from "./client";

export const getOrders = async (): Promise<Order[]> => {
	const response = await apiFetch("/api/orders/");

	if (!response.ok) {
		throw new Error("Could not load data: orders");
	}

	return response.json() as Promise<Order[]>;
};

export const createOrder = async (order: OrderInput): Promise<Order> => {
	const response = await apiFetch("/api/orders/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(order),
	});

	if (!response.ok) {
		throw new Error("Could not create order");
	}

	return response.json() as Promise<Order>;
};

export const updateOrder = async (
	id: number,
	order: Partial<OrderInput>,
): Promise<Order> => {
	const response = await apiFetch(`/api/orders/${id}/`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(order),
	});

	if (!response.ok) {
		throw new Error("Could not update order");
	}

	return response.json() as Promise<Order>;
};

export const deleteOrder = async (id: number): Promise<void> => {
	const response = await apiFetch(`/api/orders/${id}/`, {
		method: "DELETE",
	});

	if (!response.ok) {
		throw new Error("Could not delete order");
	}
};
