import { useState, type SubmitEvent } from "react";
import type { MealInput } from "../types/Meal";

type MealFormProps = {
	initialValues?: MealInput;
	submitLabel: string;
	onSubmit: (values: MealInput) => Promise<void>;
	onCancel: () => void;
};

const emptyValues: MealInput = {
	name: "",
};

const MealForm = ({
	initialValues = emptyValues,
	submitLabel,
	onSubmit,
	onCancel,
}: MealFormProps) => {
	const [values, setValues] = useState<MealInput>(initialValues);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	const updateField = (field: keyof MealInput, value: string) => {
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
			setError("Could not save meal");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
			<div>
				<label className="label-text" htmlFor="name">
					Name
				</label>
				<input
					id="name"
					className="input"
					value={values.name}
					onChange={(event) =>
						updateField("name", event.target.value)
					}
						maxLength={35}
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

export default MealForm;
