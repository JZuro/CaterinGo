import { useState } from "react";
import heroImg from "./assets/hero.png";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import "./App.css";

function App() {
	const [count, setCount] = useState(0);

	return (
		<>
			<section id="center">
				<header className="flex flex-row items-center justify-items-start gap-3 w-full font-bold text-xl tracking-wide">
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
				</header>
				<div className="hero">
					<img
						src={heroImg}
						className="base"
						width="170"
						height="179"
						alt=""
					/>
					<img
						src={reactLogo}
						className="framework"
						alt="React logo"
					/>
					<img src={viteLogo} className="vite" alt="Vite logo" />
				</div>
				<div>
					<h1>Get started</h1>
					<p>
						Edit <code>src/App.tsx</code> and save to test{" "}
						<code>HMR</code>
					</p>
				</div>
				<button
					type="button"
					className="counter"
					onClick={() => setCount((count) => count + 1)}
				>
					Count is {count}
				</button>
			</section>

			<div className="ticks"></div>

			<section id="next-steps">
				<div id="docs">
					<svg
						className="icon"
						role="presentation"
						aria-hidden="true"
					>
						<use href="/icons.svg#documentation-icon"></use>
					</svg>
					<h2>Documentation</h2>
					<p>Your questions, answered</p>
					<ul>
						<li>
							<a href="https://vite.dev/" target="_blank">
								<img className="logo" src={viteLogo} alt="" />
								Explore Vite
							</a>
						</li>
						<li>
							<a href="https://react.dev/" target="_blank">
								<img
									className="button-icon"
									src={reactLogo}
									alt=""
								/>
								Learn more
							</a>
						</li>
					</ul>
				</div>
				<div id="social">
					<svg
						className="icon"
						role="presentation"
						aria-hidden="true"
					>
						<use href="/icons.svg#social-icon"></use>
					</svg>
					<h2>Connect with us</h2>
					<p>Join the Vite community</p>
					<ul>
						<li>
							<a
								href="https://github.com/vitejs/vite"
								target="_blank"
							>
								<svg
									className="button-icon"
									role="presentation"
									aria-hidden="true"
								>
									<use href="/icons.svg#github-icon"></use>
								</svg>
								GitHub
							</a>
						</li>
						<li>
							<a href="https://chat.vite.dev/" target="_blank">
								<svg
									className="button-icon"
									role="presentation"
									aria-hidden="true"
								>
									<use href="/icons.svg#discord-icon"></use>
								</svg>
								Discord
							</a>
						</li>
						<li>
							<a href="https://x.com/vite_js" target="_blank">
								<svg
									className="button-icon"
									role="presentation"
									aria-hidden="true"
								>
									<use href="/icons.svg#x-icon"></use>
								</svg>
								X.com
							</a>
						</li>
						<li>
							<a
								href="https://bsky.app/profile/vite.dev"
								target="_blank"
							>
								<svg
									className="button-icon"
									role="presentation"
									aria-hidden="true"
								>
									<use href="/icons.svg#bluesky-icon"></use>
								</svg>
								Bluesky
							</a>
						</li>
					</ul>
				</div>
			</section>

			<div className="ticks"></div>
			<section id="spacer"></section>
		</>
	);
}

export default App;
