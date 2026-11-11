import { HttpResponse, http } from "msw/http";
import { addressData } from "./addressData";
import { mealData } from "./mealData";
import { orderData } from "./orderData";
import type {
	OptimizedRoute,
	RouteOptimizationInput,
	RouteStop,
} from "../types/Route";

let currentRoute: OptimizedRoute | null = null;

const toStop = (
	addressId: number,
	position: number,
	kind: RouteStop["kind"],
): RouteStop => {
	const address = addressData.find((item) => item.id === addressId);

	if (!address || !address.latitude || !address.longitude) {
		throw new Error("Mock address has no coordinates");
	}

	return {
		...address,
		address_id: address.id,
		latitude: address.latitude,
		longitude: address.longitude,
		position,
		kind,
		label: [
			address.street,
			address.apartment,
			`${address.postal_code} ${address.city}`,
		]
			.filter(Boolean)
			.join(", "),
		order_ids: orderData
			.filter(
				(order) =>
					order.status === "pending" && order.address.id === address.id,
			)
			.map((order) => order.id),
	};
};

export const handlers = [
	http.get("/api/addresses/", () => {
		return HttpResponse.json(addressData);
	}),
	http.get("/api/meals/", () => {
		return HttpResponse.json(mealData);
	}),
	http.get("/api/orders/", () => {
		return HttpResponse.json(orderData);
	}),
	http.get("/api/routes/current/", () => {
		return currentRoute
			? HttpResponse.json(currentRoute)
			: HttpResponse.json(
					{ detail: "No route has been optimized yet." },
					{ status: 404 },
				);
	}),
	http.post("/api/routes/optimize/", async ({ request }) => {
		const input = (await request.json()) as RouteOptimizationInput;
		const pendingAddressIds = orderData
			.filter((order) => order.status === "pending")
			.map((order) => order.address.id)
			.filter(
				(addressId, index, all) =>
					addressId !== input.start_address_id &&
					addressId !== input.end_address_id &&
					all.indexOf(addressId) === index,
			);
		const addressIds = [
			input.start_address_id,
			...pendingAddressIds,
			input.end_address_id,
		];

		try {
			const stops = addressIds.map((addressId, position) =>
				toStop(
					addressId,
					position,
					position === 0
						? "start"
						: position === addressIds.length - 1
							? "end"
							: "delivery",
				),
			);

			currentRoute = {
				id: Date.now(),
				created_at: new Date().toISOString(),
				start: stops[0],
				end: stops.at(-1)!,
				stops,
				distance_meters: Math.max(1, stops.length - 1) * 3200,
				duration_seconds: Math.max(1, stops.length - 1) * 480,
			};

			return HttpResponse.json(currentRoute, { status: 201 });
		} catch {
			return HttpResponse.json(
				{ detail: "Could not optimize mock route" },
				{ status: 400 },
			);
		}
	}),
];
