import type { Meal } from "../types/Meal";

export const getMeals = async (): Promise<Meal[]> => {
	const response = await fetch("/api/meals/");

	if (!response.ok) {
		throw new Error("Could not load data: meals");
	}

	return response.json() as Promise<Meal[]>;
};
