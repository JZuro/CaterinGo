import { queryOptions } from "@tanstack/react-query";
import { getAddresses } from "./addresses";
import { getMeals } from "./meals";
import { getOrders } from "./orders";
import { getCurrentRoute } from "./routes";

export const queryKeys = {
	addresses: ["addresses"] as const,
	meals: ["meals"] as const,
	orders: ["orders"] as const,
	currentRoute: ["current-route"] as const,
};

export const addressesQuery = queryOptions({
	queryKey: queryKeys.addresses,
	queryFn: getAddresses,
});

export const mealsQuery = queryOptions({
	queryKey: queryKeys.meals,
	queryFn: getMeals,
});

export const ordersQuery = queryOptions({
	queryKey: queryKeys.orders,
	queryFn: getOrders,
});

export const currentRouteQuery = queryOptions({
	queryKey: queryKeys.currentRoute,
	queryFn: getCurrentRoute,
});
