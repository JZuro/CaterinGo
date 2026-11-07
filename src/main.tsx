import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Addresses from './components/Addresses.tsx'
import MainContent from './components/MainContent.tsx';
import Orders from './components/Orders.tsx'
import Routes from './components/Routes.tsx'
import Meals from './components/Meals.tsx'
import { createBrowserRouter, RouterProvider } from "react-router";

const router = createBrowserRouter([
	{
		path: "/",
		element: <App />,
		children: [
			{ path: "/", element: <MainContent /> },
			{ path: "addresses", element: <Addresses /> },
			{ path: "orders", element: <Orders /> },
			{ path: "routes", element: <Routes /> },
			{ path: "meals", element: <Meals /> },
		],
	},
]);

// run mock api during development
if (import.meta.env.DEV) {
	const { network } = await import("virtual:msw");
	const { handlers } = await import("./mocks/handlers");

	network.configure({ handlers });
	await network.enable();
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>
);
