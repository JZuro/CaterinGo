import { useEffect, useState } from "react";
import { getOrders } from "../api/orders";
import type { Order, OrderStatus } from "../types/Order";

const statusClasses: Record<OrderStatus, string> = {
	pending: "badge-warning",
	delivered: "badge-success",
	cancelled: "badge-error",
};

const Orders = () => {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;

		const loadOrders = async () => {
			try {
				const loadedOrders = await getOrders();

				if (!cancelled) {
					setOrders(loadedOrders);
					setError("");
				}
			} catch {
				if (!cancelled) {
					setError("Could not load data: orders");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		void loadOrders();

		return () => {
			cancelled = true;
		};
	}, []);

	if (loading) {
		return <p>Loading orders...</p>;
	}

	if (error) {
		return <p>{error}</p>;
	}

	return (
		<div className="border-base-content/25 h-full w-full min-w-0 max-w-full overflow-hidden border-b">
			<div className="table-scroll">
				<table className="table">
					<thead>
						<tr>
							<th>Street</th>
							<th>Status</th>
							<th>Meals</th>
							<th className="text-center">Actions</th>
						</tr>
					</thead>

					<tbody>
						{orders.length === 0 ? (
							<tr>
								<td colSpan={4} className="text-center">
									No orders found
								</td>
							</tr>
						) : (
							orders.map((order) => (
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
													key={item.meal.id}
													className="badge badge-soft badge-primary whitespace-nowrap"
												>
													{item.meal.name} ×{" "}
													{item.quantity}
												</span>
											))}
										</div>
									</td>

									<td className="whitespace-nowrap">
										<button
											type="button"
											className="btn btn-circle btn-text btn-sm"
											aria-label="Edit"
										>
											<span className="icon-[tabler--pencil] size-5" />
										</button>

										<button
											type="button"
											className="btn btn-circle btn-text btn-sm"
											aria-label="Delete"
										>
											<span className="icon-[tabler--trash] size-5" />
										</button>

										<button
											type="button"
											className="btn btn-circle btn-text btn-sm"
											aria-label="More"
										>
											<span className="icon-[tabler--dots-vertical] size-5" />
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default Orders;
