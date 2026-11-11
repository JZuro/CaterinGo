import type { Address } from "./Address";
import type { OrderItem, OrderItemInput } from "./OrderItem";

export type OrderStatus = "pending" | "delivered" | "cancelled";

export type Order = {
	id: number;
	status: OrderStatus;
	address: Address;
	items: OrderItem[];
};

export type OrderInput = {
	status: OrderStatus;
	address_id: number;
	items: OrderItemInput[];
};
