import { useEffect, useState, type SubmitEvent } from "react";
import { getAddresses } from "../api/addresses";
import { getCurrentRoute, optimizeRoute } from "../api/routes";
import type { Address } from "../types/Address";
import type { OptimizedRoute, RouteStopKind } from "../types/Route";

const stopClasses: Record<RouteStopKind, string> = {
	start: "badge-info",
	delivery: "badge-primary",
	end: "badge-success",
};

const hasCoordinates = (address: Address) =>
	address.latitude !== null && address.longitude !== null;

const formatAddress = (address: Address) =>
	[
		address.street,
		address.apartment,
		`${address.postal_code} ${address.city}`,
	]
		.filter(Boolean)
		.join(", ");

const formatDistance = (meters: number) =>
	`${(meters / 1000).toLocaleString(undefined, {
		maximumFractionDigits: 1,
	})} km`;

const formatDuration = (seconds: number) => {
	const minutes = Math.round(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;

	return hours > 0 ? `${hours} h ${remainingMinutes} min` : `${minutes} min`;
};

const escapeCsvCell = (value: string | number) =>
	`"${String(value).replaceAll('"', '""')}"`;

const downloadRouteCsv = (route: OptimizedRoute) => {
	const rows = route.stops.map((stop) => [
		stop.position + 1,
		stop.kind,
		stop.label,
		(stop.order_items ?? [])
			.map((item) => `${item.quantity} × ${item.meal_name}`)
			.join("; "),
		stop.latitude,
		stop.longitude,
	]);
	const csv = [
		["Stop", "Type", "Address", "Meals", "Latitude", "Longitude"],
		...rows,
	]
		.map((row) => row.map(escapeCsvCell).join(","))
		.join("\r\n");
	const blob = new Blob(["\uFEFF", csv], {
		type: "text/csv;charset=utf-8",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	const date = new Date(route.created_at).toISOString().slice(0, 10);

	link.href = url;
	link.download = `route-${route.id}-${date}.csv`;
	document.body.append(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
};

const getGoogleMapsUrl = (route: OptimizedRoute) => {
	const stops = route.stops.map((stop) =>
		encodeURIComponent(
			`${stop.street}, ${stop.postal_code} ${stop.city}`,
		).replaceAll("%20", "+"),
	);

	return `https://www.google.com/maps/dir/${stops.join("/")}/`;
};

const Routes = () => {
	const [addresses, setAddresses] = useState<Address[]>([]);
	const [route, setRoute] = useState<OptimizedRoute | null>(null);
	const [startAddressId, setStartAddressId] = useState(0);
	const [endAddressId, setEndAddressId] = useState(0);
	const [loading, setLoading] = useState(true);
	const [optimizing, setOptimizing] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;

		const loadData = async () => {
			try {
				const [loadedAddresses, currentRoute] = await Promise.all([
					getAddresses(),
					getCurrentRoute(),
				]);

				if (cancelled) {
					return;
				}

				const geocodedAddresses = loadedAddresses.filter(hasCoordinates);
				const currentStart = geocodedAddresses.find(
					(address) => address.id === currentRoute?.start.address_id,
				);
				const currentEnd = geocodedAddresses.find(
					(address) => address.id === currentRoute?.end.address_id,
				);

				setAddresses(loadedAddresses);
				setRoute(currentRoute);
				setStartAddressId(
					currentStart?.id ?? geocodedAddresses[0]?.id ?? 0,
				);
				setEndAddressId(
					currentEnd?.id ?? geocodedAddresses.at(-1)?.id ?? 0,
				);
			} catch {
				if (!cancelled) {
					setError("Could not load route data");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		void loadData();

		return () => {
			cancelled = true;
		};
	}, []);

	const handleOptimize = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");

		if (startAddressId === 0 || endAddressId === 0) {
			setError("Select a start and end address");
			return;
		}

		setOptimizing(true);

		try {
			const optimizedRoute = await optimizeRoute({
				start_address_id: startAddressId,
				end_address_id: endAddressId,
			});
			setRoute(optimizedRoute);
		} catch (caughtError) {
			setError(
				caughtError instanceof Error
					? caughtError.message
					: "Could not optimize route",
			);
		} finally {
			setOptimizing(false);
		}
	};

	const geocodedCount = addresses.filter(hasCoordinates).length;

	return (
		<div className="h-full w-full overflow-auto text-left">
			<section className="border-base-content/25 border-b p-4 sm:p-6">
				<div className="mx-auto max-w-3xl">
					<h2>Plan route</h2>
					<p className="mb-4 text-sm">
						Pending orders are included when you optimize. The current route
						stays unchanged until a new one is ready.
					</p>

					<form
						className="grid items-end gap-4 md:grid-cols-[1fr_1fr_auto]"
						onSubmit={handleOptimize}
					>
						<div>
							<label className="label-text" htmlFor="route-start">
								Start
							</label>
							<select
								id="route-start"
								className="select w-full"
								value={startAddressId}
								onChange={(event) =>
									setStartAddressId(Number(event.target.value))
								}
								disabled={loading || optimizing}
							>
								<option value={0}>Select address</option>
								{addresses.map((address) => (
									<option
										key={address.id}
										value={address.id}
										disabled={!hasCoordinates(address)}
									>
										{formatAddress(address)}
										{hasCoordinates(address) ? "" : " — no GPS"}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="label-text" htmlFor="route-end">
								End
							</label>
							<select
								id="route-end"
								className="select w-full"
								value={endAddressId}
								onChange={(event) =>
									setEndAddressId(Number(event.target.value))
								}
								disabled={loading || optimizing}
							>
								<option value={0}>Select address</option>
								{addresses.map((address) => (
									<option
										key={address.id}
										value={address.id}
										disabled={!hasCoordinates(address)}
									>
										{formatAddress(address)}
										{hasCoordinates(address) ? "" : " — no GPS"}
									</option>
								))}
							</select>
						</div>

						<button
							type="submit"
							className="btn btn-primary"
							disabled={loading || optimizing || geocodedCount === 0}
						>
							{optimizing ? "Optimizing..." : "Optimize"}
						</button>
					</form>

					{geocodedCount === 0 && !loading && (
						<p className="text-warning mt-3 text-sm">
							No addresses have GPS coordinates yet.
						</p>
					)}
					{error && <p className="text-error mt-3 text-sm">{error}</p>}
				</div>
			</section>

			<section className="mx-auto max-w-3xl p-4 sm:p-6">
				{loading ? (
					<p>Loading route...</p>
				) : route ? (
					<>
						<div className="mb-5 flex flex-wrap items-end justify-between gap-3">
							<div>
								<h2>Current route</h2>
								<p className="text-sm">
									Created {new Date(route.created_at).toLocaleString()}
								</p>
							</div>
							<div className="flex flex-col items-end gap-2">
								<div className="flex gap-2">
									<span className="badge badge-soft badge-primary">
										{formatDistance(route.distance_meters)}
									</span>
									<span className="badge badge-soft badge-info">
										{formatDuration(route.duration_seconds)}
									</span>
								</div>
								<div className="flex flex-wrap justify-end gap-2">
									<button
										type="button"
										className="btn btn-sm btn-outline"
										onClick={() => downloadRouteCsv(route)}
									>
										Download CSV
									</button>
									<a
										className="btn btn-sm btn-primary"
										href={getGoogleMapsUrl(route)}
										target="_blank"
										rel="noreferrer"
									>
										Open in Google Maps
									</a>
								</div>
							</div>
						</div>

						<ol className="flex flex-col gap-3">
							{route.stops.map((stop) => (
								<li
									key={`${stop.position}-${stop.address_id}`}
									className="border-base-content/20 flex items-center gap-3 rounded-lg border p-3"
								>
									<div className="bg-base-200 flex size-9 shrink-0 items-center justify-center rounded-full font-medium">
										{stop.position + 1}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-base-content font-medium">
											{stop.label}
										</p>
										{stop.order_items && stop.order_items.length > 0 && (
											<ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
												{stop.order_items.map((item) => (
													<li key={item.meal_name}>
														{item.quantity} × {item.meal_name}
													</li>
												))}
											</ul>
										)}
									</div>
									<span
										className={`badge badge-soft capitalize ${stopClasses[stop.kind]}`}
									>
										{stop.kind}
									</span>
								</li>
							))}
						</ol>
					</>
				) : (
					<div className="border-base-content/20 rounded-lg border border-dashed p-8 text-center">
						<h2>No route yet</h2>
						<p>Select the start and end addresses, then optimize.</p>
					</div>
				)}
			</section>
		</div>
	);
};

export default Routes;
