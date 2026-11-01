import { useState } from "react";
import { Link } from "react-router";

function NavBar() {
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<header className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
			<Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded font-bold text-xl tracking-wide focus-visible:outline-2 focus-visible:outline-offset-4">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="50"
					height="50"
					viewBox="0 0 48 48"
					className="size-10 shrink-0 -scale-y-100 stroke-white sm:size-[50px]"
					aria-hidden="true"
				>
					<path
						fill="none"
						stroke="inherit"
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M36.588 41.429a21.428 21.428 0 0 1-12.594 4.065C12.108 45.494 2.5 35.886 2.5 24S12.107 2.506 23.994 2.506S45.488 12.114 45.488 24"
					/>
					<path
						fill="none"
						stroke="inherit"
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M32.523 36.594a15.097 15.097 0 0 1-8.53 2.618c-8.406 0-15.211-6.805-15.211-15.212S15.587 8.788 23.994 8.788S39.206 15.593 39.206 24"
					/>
					<path
						fill="none"
						stroke="inherit"
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M28.459 31.73a8.807 8.807 0 0 1-4.465 1.2c-4.927 0-8.93-4.003-8.93-8.93s4.003-8.93 8.93-8.93s8.93 4.003 8.93 8.93m-8.93 0H45.5"
					/>
				</svg>
				<div>CaterinGo</div>
			</Link>
			<button
				type="button"
				className="size-11 text-2xl md:hidden"
				aria-label="Toggle menu"
				aria-expanded={menuOpen}
				aria-controls="primary-navigation"
				onClick={() => setMenuOpen(!menuOpen)}
			>
				<span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
			</button>
			<nav
				id="primary-navigation"
				aria-label="Main navigation"
				className={`${menuOpen ? "flex" : "hidden"} w-full flex-col gap-4 py-3 md:flex md:w-auto md:flex-row md:gap-8`}
			>
				<Link to="/addresses" onClick={() => setMenuOpen(false)}>Addresses</Link>
				<Link to="/orders" onClick={() => setMenuOpen(false)}>Orders</Link>
				<Link to="/routes" onClick={() => setMenuOpen(false)}>Routes</Link>
			</nav>
		</header>
	);
}

export default NavBar;
