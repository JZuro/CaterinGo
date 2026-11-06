import { Link } from "react-router";

const addresses = [
	{ street: "al. 3 Maja 1", apartment: "—", city: "Kraków", postalCode: "30-062" },
	{ street: "Rynek Główny 3", apartment: "—", city: "Kraków", postalCode: "31-042" },
	{ street: "Pijarska 15", apartment: "—", city: "Kraków", postalCode: "31-015" },
	{ street: "św. Marka 17", apartment: "—", city: "Kraków", postalCode: "31-018" },
	{ street: "Pijarska 8", apartment: "—", city: "Kraków", postalCode: "31-015" },
	{ street: "Piłsudskiego 12", apartment: "—", city: "Kraków", postalCode: "31-109" },
	{ street: "Floriańska 41", apartment: "—", city: "Kraków", postalCode: "31-019" },
	{ street: "plac Szczepański 9", apartment: "—", city: "Kraków", postalCode: "31-011" },
	{ street: "Krupnicza 26", apartment: "—", city: "Kraków", postalCode: "31-123" },
	{ street: "Kanonicza 17", apartment: "—", city: "Kraków", postalCode: "31-002" },
	{ street: "plac Sikorskiego 6", apartment: "—", city: "Kraków", postalCode: "31-115" },
	{ street: "Jagiellońska 15", apartment: "—", city: "Kraków", postalCode: "31-010" },
	{ street: "Lipowa 4", apartment: "—", city: "Kraków", postalCode: "30-702" },
	{ street: "Marii Konopnickiej 26", apartment: "—", city: "Kraków", postalCode: "30-302" },
	{ street: "Tetmajera 28", apartment: "—", city: "Kraków", postalCode: "31-352" },
	{ street: "Pomorska 2", apartment: "—", city: "Kraków", postalCode: "30-039" },
	{ street: "Lubicz 16", apartment: "—", city: "Kraków", postalCode: "31-504" },
	{ street: "Gronostajowa 5", apartment: "—", city: "Kraków", postalCode: "30-387" },
	{ street: "Rakowicka 22A", apartment: "—", city: "Kraków", postalCode: "31-510" },
	{ street: "św. Wawrzyńca 15", apartment: "—", city: "Kraków", postalCode: "31-060" },
];

const Addresses = () => {
	return (
		<>
			<div className="border-base-content/25 w-full rounded-lg border">
				<div className="overflow-x-auto">
					<table className="table">
						<thead>
							<tr>
								<th>Street address</th>
								<th>
									<span className="sm:hidden">Apt.</span>
									<span className="hidden sm:inline">Apartment</span>
								</th>
								<th>City</th>
								<th>Postal code</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{addresses.map((address) => (
								<tr key={`${address.street}-${address.postalCode}`}>
									<td>{address.street}</td>
									<td>{address.apartment}</td>
									<td>{address.city}</td>
									<td>{address.postalCode}</td>
									<td>
										<button
											className="btn btn-circle btn-text btn-sm"
											aria-label={`Edit ${address.street}`}
										>
											<span className="icon-[tabler--pencil] size-5"></span>
										</button>
										<button
											className="btn btn-circle btn-text btn-sm"
											aria-label={`Delete ${address.street}`}
										>
											<span className="icon-[tabler--trash] size-5"></span>
										</button>
										<button
											className="btn btn-circle btn-text btn-sm"
											aria-label={`More actions for ${address.street}`}
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
