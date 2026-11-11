import { useEffect, useState } from "react";
import { createAddress, getAddresses, updateAddress } from "../api/addresses";
import type { Address, AddressInput } from "../types/Address";
import AddressForm from "./AddressForm";

type AddressFormState =
	| { mode: "create" }
	| { mode: "edit"; address: Address }
	| null;

const toAddressInput = (address: Address): AddressInput => ({
	street: address.street,
	apartment: address.apartment,
	city: address.city,
	postal_code: address.postal_code,
});

const Addresses = () => {
	const [addresses, setAddresses] = useState<Address[]>([]);
	const [error, setError] = useState("");
	const [formState, setFormState] = useState<AddressFormState>(null);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		getAddresses()
			.then(setAddresses)
			.catch(() => setError("Could not load data: addresses"));
	}, []);

	const handleCreate = async (values: AddressInput) => {
		const createdAddress = await createAddress(values);

		setAddresses((current) => [...current, createdAddress]);
		setFormState(null);
	};

	const handleUpdate = async (values: AddressInput) => {
		if (formState?.mode !== "edit") {
			return;
		}

		const updatedAddress = await updateAddress(
			formState.address.id,
			values
		);

		setAddresses((current) =>
			current.map((address) =>
				address.id === updatedAddress.id ? updatedAddress : address
			)
		);

		setFormState(null);
	};

	const normalizedSearch = searchQuery.trim().toLowerCase();
	const filteredAddresses = normalizedSearch
		? addresses.filter((address) =>
				[
					address.street,
					address.apartment,
					address.city,
					address.postal_code,
				].some((value) => value.toLowerCase().includes(normalizedSearch))
			)
		: addresses;

	if (error) {
		return <p>{error}</p>;
	}

	return (
		<div className="flex h-full min-h-0 w-full flex-col">
			<div className="border-base-content/25 flex shrink-0 justify-end gap-2 border-b p-2">
				<input
					type="search"
					className="input input-sm w-full max-w-xs"
					placeholder="Search addresses"
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

			{formState && (
				<section className="border-base-content/25 shrink-0 border-b p-4">
					<div className="mx-auto max-w-xl text-left">
						<h2 className="mb-4">
							{formState.mode === "create"
								? "Add address"
								: "Edit address"}
						</h2>

						<AddressForm
							key={
								formState.mode === "create"
									? "create"
									: formState.address.id
							}
							initialValues={
								formState.mode === "edit"
									? toAddressInput(formState.address)
									: undefined
							}
							submitLabel={
								formState.mode === "create"
									? "Add address"
									: "Save changes"
							}
							onSubmit={
								formState.mode === "create"
									? handleCreate
									: handleUpdate
							}
							onCancel={() => setFormState(null)}
						/>
					</div>
				</section>
			)}

			<div className="border-base-content/25 min-h-0 w-full min-w-0 flex-1 overflow-hidden border-b">
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
							{filteredAddresses.map((address) => (
								<tr key={address.id}>
									<td>{address.street}</td>
									<td>{address.apartment}</td>
									<td>{address.city}</td>
									<td>{address.postal_code}</td>
									<td className="actions-column">
										<button
											type="button"
											className="btn btn-circle btn-text btn-sm"
											aria-label="Edit"
											onClick={() =>
												setFormState({
													mode: "edit",
													address,
												})
											}
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
							))}

							{filteredAddresses.length === 0 && (
								<tr>
									<td colSpan={5} className="text-center">
										{normalizedSearch
											? "No matching addresses"
											: "No addresses yet"}
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

export default Addresses;
