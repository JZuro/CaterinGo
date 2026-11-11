import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./useAuth";

const RequireAuth = () => {
	const { user, loading } = useAuth();
	const location = useLocation();

	if (loading) {
		return (
			<div className="flex min-h-full w-full items-center justify-center">
				<span className="loading loading-spinner loading-lg" />
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

	return <Outlet />;
};

export default RequireAuth;
