export type RouteStopKind = "start" | "delivery" | "end";

export type RouteOrderItem = {
	meal_name: string;
	quantity: number;
};

export type RouteStop = {
	position: number;
	kind: RouteStopKind;
	address_id: number;
	label: string;
	street: string;
	apartment: string;
	city: string;
	postal_code: string;
	latitude: string;
	longitude: string;
	order_ids: number[];
	order_items?: RouteOrderItem[];
};

export type OptimizedRoute = {
	id: number;
	created_at: string;
	start: RouteStop;
	end: RouteStop;
	stops: RouteStop[];
	distance_meters: number;
	duration_seconds: number;
};

export type RouteOptimizationInput = {
	start_address_id: number;
	end_address_id: number;
};
