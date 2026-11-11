import { useState, type SubmitEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";
import Footer from "./Footer";

type AuthPageProps = {
	mode: "login" | "signup";
};

const AuthPage = ({ mode }: AuthPageProps) => {
	const { user, login, signup } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const isSignup = mode === "signup";
	const destination =
		(location.state as { from?: string } | null)?.from ?? "/";

	if (user) {
		return <Navigate to="/" replace />;
	}

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitting(true);
		setError("");

		try {
			if (isSignup) {
				await signup({
					username,
					password,
					password_confirm: passwordConfirm,
				});
			} else {
				await login({ username, password });
			}

			navigate(destination, { replace: true });
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? requestError.message
					: "Could not complete the request",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="flex min-h-full w-full flex-col">
			<main className="flex flex-1 items-center justify-center px-5 py-10">
				<section className="bg-base-100 border-base-content/20 w-full max-w-md rounded-2xl border p-6 text-left shadow-lg sm:p-8">
					<Link
						to="/"
						className="text-primary mb-6 block text-center text-2xl font-bold"
					>
						CaterinGo
					</Link>
					<h1 className="auth-title text-center">
						{isSignup ? "Create an account" : "Welcome back"}
					</h1>
					<p className="mb-6 text-center text-sm">
						{isSignup
							? "Create your workspace for deliveries and routes."
							: "Log in to manage your deliveries."}
					</p>

					<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
						<div>
							<label className="label-text" htmlFor="username">
								Username
							</label>
							<input
								id="username"
								className="input w-full"
								value={username}
								onChange={(event) => setUsername(event.target.value)}
								autoComplete="username"
								required
							/>
						</div>

						<div>
							<label className="label-text" htmlFor="password">
								Password
							</label>
							<input
								id="password"
								type="password"
								className="input w-full"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								autoComplete={isSignup ? "new-password" : "current-password"}
								required
							/>
						</div>

						{isSignup && (
							<div>
								<label className="label-text" htmlFor="password-confirm">
									Repeat password
								</label>
								<input
									id="password-confirm"
									type="password"
									className="input w-full"
									value={passwordConfirm}
									onChange={(event) =>
										setPasswordConfirm(event.target.value)
									}
									autoComplete="new-password"
									required
								/>
							</div>
						)}

						{error && <p className="text-error text-sm">{error}</p>}

						<button
							type="submit"
							className="btn btn-primary mt-1"
							disabled={submitting}
						>
							{submitting
								? "Please wait..."
								: isSignup
									? "Sign up"
									: "Log in"}
						</button>
					</form>

					{!isSignup && (
						<div className="bg-base-200 mt-5 rounded-lg p-3 text-sm">
							<p className="font-semibold">Demo account</p>
							<p>Username: demo</p>
							<p>Password: demo1234</p>
						</div>
					)}

					<p className="mt-6 text-center text-sm">
						{isSignup ? "Already have an account?" : "Need an account?"}{" "}
						<Link
							to={isSignup ? "/login" : "/signup"}
							className="text-primary font-semibold underline"
						>
							{isSignup ? "Log in" : "Sign up"}
						</Link>
					</p>
				</section>
			</main>
			<Footer />
		</div>
	);
};

export default AuthPage;
