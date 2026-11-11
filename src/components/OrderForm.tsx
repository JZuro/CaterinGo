import { useState, type SubmitEvent } from "react";
import type { Address } from "../types/Address";
import type { Meal } from "../types/Meal";
import type { OrderInput, OrderStatus } from "../types/Order";
import type { OrderItemInput } from "../types/OrderItem";

type OrderFormProps = {
	addresses: Address[];
	meals: Meal[];
	initialValues?: OrderInput;
	submitLabel: string;
	onSubmit: (values: OrderInput) => Promise<void>;
	onCancel: () => void;
};

const statusOptions: { value: OrderStatus; label: string }[] = [
	{ value: "pending", label: "Pending" },
	{ value: "delivered", label: "Delivered" },
	{ value: "cancelled", label: "Cancelled" },
];

const emptyItem = (): OrderItemInput => ({
	meal_id: 0,
	quantity: 1,
});

const emptyOrder = (): OrderInput => ({
	status: "pending",
	address_id: 0,
	items: [emptyItem()],
});

const formatAddress = (address: Address) =>
	[
		address.street,
		address.apartment,
		`${address.postal_code} ${address.city}`,
	]
		.filter(Boolean)
		.join(", ");

const OrderForm = ({
	addresses,
	meals,
	initialValues,
	submitLabel,
	onSubmit,
	onCancel,
}: OrderFormProps) => {
	const [values, setValues] = useState<OrderInput>(() => {
		const startingValues = initialValues ?? emptyOrder();

		return {
			...startingValues,
			items: startingValues.items.map((item) => ({ ...item })),
		};
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	const updateItem = (index: number, updates: Partial<OrderItemInput>) => {
		setValues((current) => ({
			...current,
			items: current.items.map((item, itemIndex) =>
				itemIndex === index ? { ...item, ...updates } : item
			),
		}));
	};

	const addItem = () => {
		setValues((current) => ({
			...current,
			items: [...current.items, emptyItem()],
		}));
	};

	const removeItem = (index: number) => {
		setValues((current) => ({
			...current,
			items: current.items.filter((_, itemIndex) => itemIndex !== index),
		}));
	};

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");

		if (values.address_id === 0) {
			setError("Select an address");
			return;
		}

		if (values.items.length === 0 || values.items.some((item) => item.meal_id === 0)) {
			setError("Select a meal for every item");
			return;
		}

		if (values.items.some((item) => item.quantity < 1)) {
			setError("Quantity must be at least one");
			return;
		}

		const mealIds = values.items.map((item) => item.meal_id);

		if (new Set(mealIds).size !== mealIds.length) {
			setError("Each meal can appear only once");
			return;
		}

		setIsSubmitting(true);

		try {
			await onSubmit(values);
		} catch {
			setError("Could not save order");
		} finally {
			setIsSubmitting(false);
		}
	};

	const missingOptions = addresses.length === 0 || meals.length === 0;

	return (
		<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
			<div className="grid gap-4 sm:grid-cols-2">
				<div>
					<label className="label-text" htmlFor="order-address">
						Address
					</label>
					<select
						id="order-address"
						className="select w-full"
						value={values.address_id}
						onChange={(event) =>
							setValues((current) => ({
								...current,
								address_id: Number(event.target.value),
							}))
						}
						disabled={isSubmitting}
					>
						<option value={0}>Select an address</option>
						{addresses.map((address) => (
							<option key={address.id} value={address.id}>
								{formatAddress(address)}
							</option>
						))}
					</select>
				</div>

				<div>
					<label className="label-text" htmlFor="order-status">
						Status
					</label>
					<select
						id="order-status"
						className="select w-full"
						value={values.status}
						onChange={(event) =>
							setValues((current) => ({
								...current,
								status: event.target.value as OrderStatus,
							}))
						}
						disabled={isSubmitting}
					>
						{statusOptions.map((status) => (
							<option key={status.value} value={status.value}>
								{status.label}
							</option>
						))}
					</select>
				</div>
			</div>

			<section className="flex flex-col gap-3">
				<div className="flex items-center justify-between gap-2">
					<h3 className="font-medium">Meals</h3>
					<button
						type="button"
						className="btn btn-soft btn-sm"
						onClick={addItem}
						disabled={
							isSubmitting ||
							meals.length === 0 ||
							values.items.length >= meals.length
						}
					>
						Add meal
					</button>
				</div>

				{values.items.map((item, index) => (
					<div
						key={index}
						className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_auto]"
					>
						<div>
							<label
								className="label-text"
								htmlFor={`order-meal-${index}`}
							>
								Meal {index + 1}
							</label>
							<select
								id={`order-meal-${index}`}
								className="select w-full"
								value={item.meal_id}
								onChange={(event) =>
									updateItem(index, {
										meal_id: Number(event.target.value),
									})
								}
								disabled={isSubmitting}
							>
								<option value={0}>Select a meal</option>
								{meals.map((meal) => (
									<option
										key={meal.id}
										value={meal.id}
										disabled={values.items.some(
											(otherItem, otherIndex) =>
												otherIndex !== index &&
												otherItem.meal_id === meal.id
										)}
									>
										{meal.name}
									</option>
								))}
							</select>
						</div>

						<div>
							<label
								className="label-text"
								htmlFor={`order-quantity-${index}`}
							>
								Quantity
							</label>
							<input
								id={`order-quantity-${index}`}
								type="number"
								className="input w-full"
								min={1}
								step={1}
								value={item.quantity}
								onChange={(event) =>
									updateItem(index, {
										quantity: Number(event.target.value),
									})
								}
								disabled={isSubmitting}
							/>
						</div>

						<button
							type="button"
							className="btn btn-circle btn-text"
							onClick={() => removeItem(index)}
							disabled={isSubmitting || values.items.length === 1}
							aria-label="Remove"
						>
							<span className="icon-[tabler--trash] size-5" />
						</button>
					</div>
				))}
			</section>

			{missingOptions && (
				<p className="text-warning">
					Create at least one address and meal before saving an order.
				</p>
			)}

			{error && <p className="text-error">{error}</p>}

			<div className="flex justify-end gap-2">
				<button
					type="button"
					className="btn btn-soft"
					onClick={onCancel}
					disabled={isSubmitting}
				>
					Cancel
				</button>
				<button
					type="submit"
					className="btn btn-primary"
					disabled={isSubmitting || missingOptions}
				>
					{isSubmitting ? "Saving..." : submitLabel}
				</button>
			</div>
		</form>
	);
};

export default OrderForm;
