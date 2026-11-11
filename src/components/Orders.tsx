import { useEffect, useState } from "react";
import { getAddresses } from "../api/addresses";
import { getMeals } from "../api/meals";
import {
	createOrder,
	deleteOrder,
	getOrders,
	updateOrder,
} from "../api/orders";
import type { Address } from "../types/Address";
import type { Meal } from "../types/Meal";
import type { Order, OrderInput, OrderStatus } from "../types/Order";
import { useConfirm } from "./ConfirmContext";
import OrderForm from "./OrderForm";
import OrderStatusForm from "./OrderStatusForm";

type OrderFormState =
	| { mode: "create" }
	| { mode: "edit"; order: Order }
	| { mode: "status"; order: Order }
	| null;

const statusClasses: Record<OrderStatus, string> = {
	pending: "badge-warning",
	delivered: "badge-success",
	cancelled: "badge-error",
};

const toOrderInput = (order: Order): OrderInput => ({
	status: order.status,
	address_id: order.address.id,
	items: order.items.map((item) => ({
		meal_id: item.meal.id,
		quantity: item.quantity,
	})),
});

const Orders = () => {
	const confirm = useConfirm();
	const [orders, setOrders] = useState<Order[]>([]);
	const [addresses, setAddresses] = useState<Address[]>([]);
	const [meals, setMeals] = useState<Meal[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [actionError, setActionError] = useState("");
	const [formState, setFormState] = useState<OrderFormState>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [deletingId, setDeletingId] = useState<number | null>(null);

	useEffect(() => {
		let cancelled = false;

		const loadData = async () => {
			try {
				const [loadedOrders, loadedAddresses, loadedMeals] =
					await Promise.all([getOrders(), getAddresses(), getMeals()]);

				if (!cancelled) {
					setOrders(loadedOrders);
					setAddresses(loadedAddresses);
					setMeals(loadedMeals);
					setError("");
				}
			} catch {
				if (!cancelled) {
					setError("Could not load order data");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		void loadData();

		return () => {
			cancelled = true;
		};
	}, []);

	const handleCreate = async (values: OrderInput) => {
		const createdOrder = await createOrder(values);

		setOrders((current) => [...current, createdOrder]);
		setFormState(null);
	};

	const handleUpdate = async (values: OrderInput) => {
		if (formState?.mode !== "edit") {
			return;
		}

		const updatedOrder = await updateOrder(formState.order.id, values);

		setOrders((current) =>
			current.map((order) =>
				order.id === updatedOrder.id ? updatedOrder : order
			)
		);
		setFormState(null);
	};

	const handleStatusUpdate = async (status: OrderStatus) => {
		if (formState?.mode !== "status") {
			return;
		}

		const updatedOrder = await updateOrder(formState.order.id, { status });

		setOrders((current) =>
			current.map((order) =>
				order.id === updatedOrder.id ? updatedOrder : order
			)
		);
		setFormState(null);
	};

	const handleDelete = async (order: Order) => {
		const confirmed = await confirm({
			title: "Delete order?",
			message: `Are you sure you want to delete order #${order.id} and its order items?`,
			confirmLabel: "Delete",
			danger: true,
		});

		if (!confirmed) {
			return;
		}

		setActionError("");
		setDeletingId(order.id);

		try {
			await deleteOrder(order.id);
			setOrders((current) =>
				current.filter((item) => item.id !== order.id)
			);
			setFormState((current) =>
				current &&
				current.mode !== "create" &&
				current.order.id === order.id
					? null
					: current
			);
		} catch {
			setActionError("Could not delete order");
		} finally {
			setDeletingId(null);
		}
	};

	const normalizedSearch = searchQuery.trim().toLowerCase();
	const filteredOrders = normalizedSearch
		? orders.filter((order) =>
				[
					String(order.id),
					order.status,
					order.address.street,
					order.address.apartment,
					order.address.city,
					order.address.postal_code,
					...order.items.map((item) => item.meal.name),
				].some((value) =>
					value.toLowerCase().includes(normalizedSearch)
				)
			)
		: orders;

	if (loading) {
		return <p>Loading orders...</p>;
	}

	if (error) {
		return <p>{error}</p>;
	}

	return (
		<div className="flex h-full min-h-0 w-full flex-col">
			<div className="border-base-content/25 flex shrink-0 justify-end gap-2 border-b p-2">
				<input
					type="search"
					className="input input-sm w-full max-w-xs"
					placeholder="Search orders"
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
					<div className="mx-auto max-w-2xl text-left">
						<h2 className="mb-4">
							{formState.mode === "create"
								? "Add order"
								: formState.mode === "edit"
									? "Edit order"
									: `Change order #${formState.order.id} status`}
						</h2>

						{formState.mode === "status" ? (
							<OrderStatusForm
								key={formState.order.id}
								initialStatus={formState.order.status}
								onSubmit={handleStatusUpdate}
								onCancel={() => setFormState(null)}
							/>
						) : (
							<OrderForm
								key={
									formState.mode === "create"
										? "create"
										: formState.order.id
								}
								addresses={addresses}
								meals={meals}
								initialValues={
									formState.mode === "edit"
										? toOrderInput(formState.order)
										: undefined
								}
								submitLabel={
									formState.mode === "create"
										? "Add order"
										: "Save changes"
								}
								onSubmit={
									formState.mode === "create"
										? handleCreate
										: handleUpdate
								}
								onCancel={() => setFormState(null)}
							/>
						)}
					</div>
				</section>
			)}

			<div className="border-base-content/25 min-h-0 w-full min-w-0 flex-1 overflow-hidden border-b">
				<div className="table-scroll">
					<table className="table">
						<thead>
							<tr>
								<th>Street</th>
								<th>Status</th>
								<th>Meals</th>
								<th className="actions-column">Actions</th>
							</tr>
						</thead>

						<tbody>
							{filteredOrders.map((order) => (
								<tr key={order.id}>
									<td>{order.address.street}</td>

									<td>
										<span
											className={`badge badge-soft capitalize ${
												statusClasses[order.status]
											}`}
										>
											{order.status}
										</span>
									</td>

									<td>
										<div className="flex flex-col items-start gap-1">
											{order.items.map((item) => (
												<span
													key={item.id}
													className="badge badge-soft badge-primary whitespace-nowrap"
												>
													{item.meal.name} × {item.quantity}
												</span>
											))}
										</div>
									</td>

									<td className="actions-column">
										<button
											type="button"
											className="btn btn-circle btn-text btn-sm"
											aria-label="Edit"
											onClick={() =>
												setFormState({ mode: "edit", order })
											}
										>
											<span className="icon-[tabler--pencil] size-5" />
										</button>

										<button
											type="button"
											className="btn btn-circle btn-text btn-sm"
											aria-label="Delete"
											onClick={() => void handleDelete(order)}
											disabled={deletingId === order.id}
										>
											<span className="icon-[tabler--trash] size-5" />
										</button>

										<button
											type="button"
											className="btn btn-circle btn-text btn-sm"
											aria-label="More"
											onClick={() =>
												setFormState({
													mode: "status",
													order,
												})
											}
										>
											<span className="icon-[tabler--dots-vertical] size-5" />
										</button>
									</td>
								</tr>
							))}

							{filteredOrders.length === 0 && (
								<tr>
									<td colSpan={4} className="text-center">
										{normalizedSearch
											? "No matching orders"
											: "No orders yet"}
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

export default Orders;
