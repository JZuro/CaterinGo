import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { queryClient } from "./api/queryClient.ts";
import { AuthProvider } from "./auth/AuthProvider.tsx";
import RequireAuth from "./auth/RequireAuth.tsx";
import Addresses from "./components/Addresses.tsx";
import AuthPage from "./components/AuthPage.tsx";
import { ConfirmProvider } from "./components/ConfirmDialog.tsx";
import MainContent from "./components/MainContent.tsx";
import Meals from "./components/Meals.tsx";
import Orders from "./components/Orders.tsx";
import Routes from "./components/Routes.tsx";

const router = createBrowserRouter([
	{
		element: <RequireAuth />,
		children: [
			{
				path: "/",
				element: <App />,
				children: [
					{ index: true, element: <MainContent /> },
					{ path: "addresses", element: <Addresses /> },
					{ path: "orders", element: <Orders /> },
					{ path: "routes", element: <Routes /> },
					{ path: "meals", element: <Meals /> },
				],
			},
		],
	},
	{ path: "/login", element: <AuthPage mode="login" /> },
	{ path: "/signup", element: <AuthPage mode="signup" /> },
]);

// run mock api during development
if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true") {
	const { network } = await import("virtual:msw");
	const { handlers } = await import("./mocks/handlers");

	network.configure({ handlers });
	await network.enable();
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<ConfirmProvider>
					<RouterProvider router={router} />
				</ConfirmProvider>
			</AuthProvider>
		</QueryClientProvider>
	</StrictMode>
);
