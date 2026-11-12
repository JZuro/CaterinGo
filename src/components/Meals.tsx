import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createMeal, deleteMeal, updateMeal } from "../api/meals";
import { mealsQuery, queryKeys } from "../api/queries";
import type { Meal, MealInput } from "../types/Meal";
import MealForm from "./MealForm";
import { useConfirm } from "./ConfirmContext";

type MealFormState = { mode: "create" } | { mode: "edit"; meal: Meal } | null;

const toMealInput = (meal: Meal): MealInput => ({
	name: meal.name,
});

const Meals = () => {
	const confirm = useConfirm();
	const queryClient = useQueryClient();
	const { data: meals = [], isPending, isError } = useQuery(mealsQuery);
	const [formState, setFormState] = useState<MealFormState>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [actionError, setActionError] = useState("");
	const [deletingId, setDeletingId] = useState<number | null>(null);

	const handleCreate = async (values: MealInput) => {
		const createdMeal = await createMeal(values);

		queryClient.setQueryData<Meal[]>(queryKeys.meals, (current = []) => [
			...current,
			createdMeal,
		]);
		setFormState(null);
	};

	const handleDelete = async (meal: Meal) => {
		const confirmed = await confirm({
			title: "Delete meal?",
			message: `Are you sure you want to delete: ${meal.name} and its order items?`,
			confirmLabel: "Delete",
			danger: true,
		});

		if (!confirmed) {
			return;
		}

		setActionError("");
		setDeletingId(meal.id);

		try {
			await deleteMeal(meal.id);

			queryClient.setQueryData<Meal[]>(
				queryKeys.meals,
				(current = []) => current.filter((item) => item.id !== meal.id),
			);
			void queryClient.invalidateQueries({
				queryKey: queryKeys.orders,
				refetchType: "all",
			});
			setFormState((current) =>
				current?.mode === "edit" && current.meal.id === meal.id
					? null
					: current
			);
		} catch {
			setActionError("Could not delete meal");
		} finally {
			setDeletingId(null);
		}
	};

	const handleUpdate = async (values: MealInput) => {
		if (formState?.mode !== "edit") {
			return;
		}

		const updatedMeal = await updateMeal(formState.meal.id, values);

		queryClient.setQueryData<Meal[]>(
			queryKeys.meals,
			(current = []) =>
				current.map((meal) =>
					meal.id === updatedMeal.id ? updatedMeal : meal,
				),
		);
		void queryClient.invalidateQueries({
			queryKey: queryKeys.orders,
			refetchType: "all",
		});

		setFormState(null);
	};

	const normalizedSearch = searchQuery.trim().toLowerCase();
	const filteredMeals = normalizedSearch
		? meals.filter((meal) =>
				meal.name.toLowerCase().includes(normalizedSearch)
			)
		: meals;

	if (isPending) {
		return <p className="p-4">Loading meals...</p>;
	}

	if (isError) {
		return <p className="p-4">Could not load data: meals</p>;
	}

	return (
		<div className="flex h-full min-h-0 w-full flex-col">
			<div className="border-base-content/25 flex shrink-0 justify-end gap-2 border-b p-2">
				<input
					type="search"
					className="input input-sm w-full max-w-xs"
					placeholder="Search meals"
					value={searchQuery}
					onChange={(event) => setSearchQuery(event.target.value)}
				/>
				<button
					type="button"
					className="btn btn-primary btn-sm"
					onClick={() => setFormState({ mode: "create" })}
				>
					+
				</button>
			</div>

			{actionError && (
				<p className="text-error shrink-0 px-4 py-2 text-left">
					{actionError}
				</p>
			)}

			{formState && (
				<section className="border-base-content/25 shrink-0 border-b p-4">
					<div className="mx-auto max-w-xl text-left">
						<h2 className="mb-4">
							{formState.mode === "create"
								? "Add meal"
								: "Edit meal"}
						</h2>

						<MealForm
							key={
								formState.mode === "create"
									? "create"
									: formState.meal.id
							}
							initialValues={
								formState.mode === "edit"
									? toMealInput(formState.meal)
									: undefined
							}
							submitLabel={
								formState.mode === "create"
									? "Add meal"
									: "Save changes"
							}
							onSubmit={
								formState.mode === "create"
									? handleCreate
									: handleUpdate
							}
							onCancel={() => setFormState(null)}
						/>
					</div>
				</section>
			)}

			<div className="border-base-content/25 min-h-0 w-full min-w-0 flex-1 overflow-hidden border-b">
				<div className="table-scroll">
					<table className="table">
						<thead>
							<tr>
								<th>Name</th>
								<th className="actions-column">Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredMeals.map((meal) => (
								<tr key={meal.id}>
									<td>{meal.name}</td>
									<td className="actions-column">
										<button
											type="button"
											className="btn btn-circle btn-text btn-sm"
											aria-label="Edit"
											onClick={() =>
												setFormState({
													mode: "edit",
													meal,
												})
											}
										>
											<span className="icon-[tabler--pencil] size-5" />
										</button>
										<button
											type="button"
											className="btn btn-circle btn-text btn-sm"
											aria-label="Delete"
											onClick={() => void handleDelete(meal)}
											disabled={deletingId === meal.id}
										>
											<span className="icon-[tabler--trash] size-5" />
										</button>
									</td>
								</tr>
							))}

							{filteredMeals.length === 0 && (
								<tr>
									<td colSpan={2} className="text-center">
										{normalizedSearch
											? "No matching meals"
											: "No meals yet"}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default Meals;
