import { useQueries } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router";
import {
	addressesQuery,
	currentRouteQuery,
	mealsQuery,
	ordersQuery,
} from "../api/queries";
import { useAuth } from "./useAuth";

const RequireAuth = () => {
	const { user, loading } = useAuth();
	const location = useLocation();
	const dataQueries = useQueries({
		queries: [
			{ ...addressesQuery, enabled: Boolean(user) },
			{ ...mealsQuery, enabled: Boolean(user) },
			{ ...ordersQuery, enabled: Boolean(user) },
			{ ...currentRouteQuery, enabled: Boolean(user) },
		],
	});
	const loadingData = Boolean(user) && dataQueries.some((query) => query.isPending);
	const dataError = dataQueries.some(
		(query) => query.isError && query.data === undefined,
	);

	if (loading || loadingData) {
		return (
			<div className="flex min-h-full w-full flex-col items-center justify-center gap-3">
				<span className="loading loading-spinner loading-lg" />
				<p>Loading your delivery data...</p>
			</div>
		);
	}

	if (!user) {
		return (
			<Navigate
				to="/login"
				replace
				state={{ from: location.pathname }}
			/>
		);
	}

	if (dataError) {
		return (
			<div className="flex min-h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
				<p>Could not load your delivery data.</p>
				<button
					type="button"
					className="btn btn-primary btn-sm"
					onClick={() =>
						dataQueries.forEach((query) => void query.refetch())
					}
				>
					Try again
				</button>
			</div>
		);
	}

	return <Outlet />;
};

export default RequireAuth;
