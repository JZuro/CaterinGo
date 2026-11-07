import { Link } from "react-router";
import { useEffect, useState } from "react";
import { getMeals } from "../api/meals";
import type { Meal } from "../types/Meal";

const Addresses = () => {
	const [addresses, setAddresses] = useState<Meal[]>([]);
	const [error, setError] = useState("");

	useEffect(() => {
		getMeals()
			.then(setAddresses)
			.catch(() => setError("Could not load data: meals"));
	}, []);

	if (error) {
		return <p>{error}</p>;
	}

	return (
		<>
			<div className="border-base-content/25 w-full rounded-lg border">
				<div className="overflow-x-auto">
					<table className="table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{addresses.map((meal) => (
								<tr key={meal.id}>
									<td>{meal.name}</td>
									<td>
										<button
											className="btn btn-circle btn-text btn-sm"
											aria-label={`Edit ${meal.name}`}
										>
											<span className="icon-[tabler--pencil] size-5"></span>
										</button>
										<button
											className="btn btn-circle btn-text btn-sm"
											aria-label={`Delete ${meal.name}`}
										>
											<span className="icon-[tabler--trash] size-5"></span>
										</button>
										<button
											className="btn btn-circle btn-text btn-sm"
											aria-label={`More actions for ${meal.name}`}
										>
											<span className="icon-[tabler--dots-vertical] size-5"></span>
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
			<Link to="/">Click here to go back</Link>
		</>
	);
};

export default Addresses;
