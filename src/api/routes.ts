import type {
	OptimizedRoute,
	RouteOptimizationInput,
} from "../types/Route";

const getErrorMessage = async (response: Response) => {
	try {
		const data = (await response.json()) as { detail?: string };
		return data.detail ?? "Could not optimize route";
	} catch {
		return "Could not optimize route";
	}
};

export const getCurrentRoute = async (): Promise<OptimizedRoute | null> => {
	const response = await fetch("/api/routes/current/");

	if (response.status === 404) {
		return null;
	}

	if (!response.ok) {
		throw new Error("Could not load current route");
	}

	return response.json() as Promise<OptimizedRoute>;
};

export const optimizeRoute = async (
	input: RouteOptimizationInput,
): Promise<OptimizedRoute> => {
	const response = await fetch("/api/routes/optimize/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
	});

	if (!response.ok) {
		throw new Error(await getErrorMessage(response));
	}

	return response.json() as Promise<OptimizedRoute>;
};
