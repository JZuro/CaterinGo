function NavBar() {
	return (
		<header className="flex flex-row items-center justify-between w-full">
			<div className="flex flex-row items-center justify-start gap-3 px-5 py-6 sm:px-8 font-bold text-xl tracking-wide">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="50"
					height="50"
					viewBox="0 0 48 48"
					className="-scale-y-100 stroke-white"
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
			</div>
			<nav className="flex gap-30 px-30">
				<button>Orders</button>
				<button>Orders</button>
				<button>Orders</button>

			</nav>
		</header>
	);
}

export default NavBar;
