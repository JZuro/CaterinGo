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
			<div className="border-base-content/25 h-full w-full min-w-0 max-w-full overflow-hidden border-b">
				<div className="table-scroll">
					<table className="table">
						<thead>
							<tr>
								<th>Name</th>
								<th className="text-center">Actions</th>
							</tr>
						</thead>
						<tbody>
							{addresses.map((meal) => (
								<tr key={meal.id}>
									<td>{meal.name}</td>
									<td className="whitespace-nowrap">
										<button
											className="btn btn-circle btn-text btn-sm"
											aria-label="Edit"
										>
											<span className="icon-[tabler--pencil] size-5"></span>
										</button>
										<button
											className="btn btn-circle btn-text btn-sm"
											aria-label="Delete"
										>
											<span className="icon-[tabler--trash] size-5"></span>
										</button>
										<button
											className="btn btn-circle btn-text btn-sm"
											aria-label="More"
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
		</>
	);
};

export default Addresses;
