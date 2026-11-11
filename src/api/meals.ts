import type { Meal, MealInput } from "../types/Meal";

export const getMeals = async (): Promise<Meal[]> => {
	const response = await fetch("/api/meals/");

	if (!response.ok) {
		throw new Error("Could not load data: meals");
	}

	return response.json() as Promise<Meal[]>;
};

export const createMeal = async (meal: MealInput): Promise<Meal> => {
	const response = await fetch("/api/meals/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(meal),
	});

	if (!response.ok) {
		throw new Error("Could not create meal");
	}

	return response.json() as Promise<Meal>;
};

export const updateMeal = async (
	id: number,
	meal: MealInput
): Promise<Meal> => {
	const response = await fetch(`/api/meals/${id}/`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(meal),
	});

	if (!response.ok) {
		throw new Error("Could not update meal");
	}

	return response.json() as Promise<Meal>;
};

export const deleteMeal = async (id: number): Promise<void> => {
	const response = await fetch(`/api/meals/${id}/`, {
		method: "DELETE",
	});

	if (!response.ok) {
		throw new Error("Could not delete meal");
	}
};
