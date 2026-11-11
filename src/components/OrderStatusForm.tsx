import { useState, type SubmitEvent } from "react";
import type { OrderStatus } from "../types/Order";

type OrderStatusFormProps = {
	initialStatus: OrderStatus;
	onSubmit: (status: OrderStatus) => Promise<void>;
	onCancel: () => void;
};

const statusOptions: { value: OrderStatus; label: string }[] = [
	{ value: "pending", label: "Pending" },
	{ value: "delivered", label: "Delivered" },
	{ value: "cancelled", label: "Cancelled" },
];

const OrderStatusForm = ({
	initialStatus,
	onSubmit,
	onCancel,
}: OrderStatusFormProps) => {
	const [status, setStatus] = useState(initialStatus);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			await onSubmit(status);
		} catch {
			setError("Could not update order status");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
			<div>
				<label className="label-text" htmlFor="quick-order-status">
					Status
				</label>
				<select
					id="quick-order-status"
					className="select w-full"
					value={status}
					onChange={(event) =>
						setStatus(event.target.value as OrderStatus)
					}
					disabled={isSubmitting}
				>
					{statusOptions.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>

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
					disabled={isSubmitting || status === initialStatus}
				>
					{isSubmitting ? "Saving..." : "Save status"}
				</button>
			</div>
		</form>
	);
};

export default OrderStatusForm;
