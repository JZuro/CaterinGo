export type Meal = {
	id: number;
	name: string;
};

export type MealInput = Omit<Meal, "id">;