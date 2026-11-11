import type { Meal } from "./Meal";

export type OrderItem = {
	id: number;
	meal: Meal;
	quantity: number;
};

export type OrderItemInput = {
	meal_id: number;
	quantity: number;
};
