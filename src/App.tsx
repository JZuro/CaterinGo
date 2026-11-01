import NavBar from "./components/NavBar.tsx";
import Footer from "./components/Footer.tsx";
import { Outlet } from "react-router";

function App() {
	return (
		<>
			<NavBar />
			<Outlet />
      <Footer />
		</>
	);
}

export default App;
