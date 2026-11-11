import { useLayoutEffect, useState } from "react";

type Theme = "light" | "dark";

const getInitialTheme = (): Theme => {
	try {
		const savedTheme = window.localStorage.getItem("theme");

		if (savedTheme === "light" || savedTheme === "dark") {
			return savedTheme;
		}
	} catch {
		// Local storage can be unavailable in privacy-restricted browsers.
	}

	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
};

function Footer() {
	const [theme, setTheme] = useState<Theme>(getInitialTheme);
	const isDark = theme === "dark";

	useLayoutEffect(() => {
		const root = document.documentElement;

		root.classList.toggle("dark", isDark);
		root.dataset.theme = theme;

		try {
			window.localStorage.setItem("theme", theme);
		} catch {
			// The selected theme still works for this session without persistence.
		}
	}, [isDark, theme]);

	return (
		<footer className="shrink-0">
			<div className="flex items-center justify-between py-1">
				<div className="px-5">
					<button
						type="button"
						className="btn btn-circle btn-text btn-xs"
						onClick={() => setTheme(isDark ? "light" : "dark")}
						aria-label="Dark mode"
						title="Dark mode"
						aria-pressed={isDark}
					>
						<span
							className={`${isDark ? "icon-[tabler--sun]" : "icon-[tabler--moon]"} size-4`}
							aria-hidden="true"
						/>
					</button>
				</div>
				<div>
					<p className="px-5 text-right text-[10px] sm:px-20">
						©2026 JZuro · Data ©{" "}
						<a
							href="https://www.openstreetmap.org/copyright"
							target="_blank"
							rel="noreferrer"
							className="underline"
						>
							OpenStreetMap contributors
						</a>
					</p>
				</div>
			</div>
		</footer>
	);
}

export default Footer;

