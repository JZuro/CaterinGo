import { useState, type SubmitEvent } from "react";
import type { AddressInput } from "../types/Address";

type AddressFormProps = {
	initialValues?: AddressInput;
	submitLabel: string;
	onSubmit: (values: AddressInput) => Promise<void>;
	onCancel: () => void;
};

const emptyValues: AddressInput = {
	street: "",
	apartment: "",
	city: "",
	postal_code: "",
};

const AddressForm = ({
	initialValues = emptyValues,
	submitLabel,
	onSubmit,
	onCancel,
}: AddressFormProps) => {
	const [values, setValues] = useState<AddressInput>(initialValues);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	const updateField = (field: keyof AddressInput, value: string) => {
		setValues((current) => ({
			...current,
			[field]: value,
		}));
	};

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsSubmitting(true);
		setError("");

		try {
			await onSubmit(values);
		} catch {
			setError("Could not save address");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
			<div>
				<label className="label-text" htmlFor="street">
					Street
				</label>
				<input
					id="street"
					className="input"
					value={values.street}
					onChange={(event) =>
						updateField("street", event.target.value)
					}
					required
				/>
			</div>

			<div>
				<label className="label-text" htmlFor="apartment">
					Apartment
				</label>
				<input
					id="apartment"
					className="input"
					value={values.apartment}
					onChange={(event) =>
						updateField("apartment", event.target.value)
					}
				/>
			</div>

			<div>
				<label className="label-text" htmlFor="city">
					City
				</label>
				<input
					id="city"
					className="input"
					value={values.city}
					onChange={(event) =>
						updateField("city", event.target.value)
					}
					required
				/>
			</div>

			<div>
				<label className="label-text" htmlFor="postal-code">
					Postal code
				</label>
				<input
					id="postal-code"
					className="input"
					value={values.postal_code}
					onChange={(event) =>
						updateField("postal_code", event.target.value)
					}
					required
				/>
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
					disabled={isSubmitting}
				>
					{isSubmitting ? "Saving..." : submitLabel}
				</button>
			</div>
		</form>
	);
};

export default AddressForm;
