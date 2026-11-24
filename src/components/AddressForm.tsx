import { useState, type SubmitEvent } from "react";
import type { AddressInput } from "../types/Address";
import {
	parseAddressList,
	sanitizeAddressField,
} from "../utils/parseAddress";

type AddressFormProps = {
	initialValues?: AddressInput;
	submitLabel: string;
	onSubmit: (values: AddressInput) => Promise<void>;
	onSubmitMultiple?: (values: AddressInput[]) => Promise<void>;
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
	onSubmitMultiple,
	onCancel,
}: AddressFormProps) => {
	const [values, setValues] = useState<AddressInput>(initialValues);
	const [multipleValues, setMultipleValues] = useState("");
	const [isMultiple, setIsMultiple] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	const updateField = (field: keyof AddressInput, value: string) => {
		setValues((current) => ({
			...current,
			[field]: sanitizeAddressField(field, value),
		}));
	};

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsSubmitting(true);
		setError("");

		try {
			if (isMultiple && onSubmitMultiple) {
				const { addresses, invalidLineNumbers } =
					parseAddressList(multipleValues);

				if (addresses.length === 0 && invalidLineNumbers.length === 0) {
					setError("Enter at least one address");
					return;
				}

				if (invalidLineNumbers.length > 0) {
					setError(
						`Could not parse line${invalidLineNumbers.length === 1 ? "" : "s"} ${invalidLineNumbers.join(", ")}`,
					);
					return;
				}

				await onSubmitMultiple(addresses);
			} else {
				await onSubmit(values);
			}
		} catch (caughtError) {
			setError(
				caughtError instanceof Error
					? caughtError.message
					: "Could not save address",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
			{isMultiple ? (
				<div>
					<label className="label-text" htmlFor="multiple-addresses">
						Addresses (one per line)
					</label>
					<textarea
						id="multiple-addresses"
						className="textarea min-h-40 w-full resize-none"
						placeholder="One address per line..."
						value={multipleValues}
						onChange={(event) =>
							setMultipleValues(event.target.value)
						}
						required
					/>
				</div>
			) : (
				<>
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
				</>
			)}

			{error && <p className="text-error">{error}</p>}

			<div className="flex justify-end gap-2">
				{onSubmitMultiple && (
					<button
						type="button"
						className="btn btn-soft mr-auto"
						onClick={() => {
							setIsMultiple((current) => !current);
							setError("");
						}}
						disabled={isSubmitting}
					>
						{isMultiple ? "Add one" : "Add multiple"}
					</button>
				)}

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
					{isSubmitting
						? "Saving..."
						: isMultiple
							? "Add addresses"
							: submitLabel}
				</button>
			</div>
		</form>
	);
};

export default AddressForm;
