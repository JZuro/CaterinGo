import { useEffect, useState } from "react";
import { getAddresses } from "../api/addresses";
import type { Address } from "../types/Address";

const Addresses = () => {
	const [addresses, setAddresses] = useState<Address[]>([]);
	const [error, setError] = useState("");

	useEffect(() => {
		getAddresses()
			.then(setAddresses)
			.catch(() => setError("Could not load data: addresses"));
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
								<th>Street address</th>
								<th>
									<span className="sm:hidden">Apt.</span>
									<span className="hidden sm:inline">
										Apartment
									</span>
								</th>
								<th>City</th>
								<th>Postal code</th>
								<th className="actions-column">Actions</th>
							</tr>
						</thead>
						<tbody>
							{addresses.map((address) => (
								<tr key={address.id}>
									<td>{address.street}</td>
									<td>{address.apartment}</td>
									<td>{address.city}</td>
									<td>{address.postalCode}</td>
									<td className="actions-column">
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
