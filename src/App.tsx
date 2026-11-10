import NavBar from "./components/NavBar.tsx";
import Footer from "./components/Footer.tsx";
import { Outlet } from "react-router";

function App() {
	return (
		<>
			<NavBar />
			<main className="relative isolate min-h-0 w-full min-w-0 flex-1 overflow-auto">
				<Outlet />
			</main>
			<Footer />
		</>
	);
}

export default App;
