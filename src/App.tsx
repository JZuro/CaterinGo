import NavBar from "./components/NavBar.tsx";
import Footer from "./components/Footer.tsx";
import { Outlet } from "react-router";

function App() {
	return (
		<>
			<NavBar />
			<main>
        <Outlet />
      </main>
      <Footer />
		</>
	);
}

export default App;
