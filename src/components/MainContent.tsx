import { Link } from "react-router";

import locationPath from "../assets/location-path.svg";

function MainContent() {
	return (
		<section className="mx-auto grid min-h-full w-full max-w-6xl items-center gap-10 px-6 py-10 text-left md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.85fr)] lg:gap-16 lg:px-12">
			<div className="mx-auto max-w-xl md:mx-0">
				<h1 className="max-w-lg">Be on the right path.</h1>
				<p className="max-w-lg text-base leading-relaxed sm:text-lg">
					Manage delivery addresses, meals and orders in one place. When
					everything is ready, create an optimized route for the day.
				</p>

				<div className="mt-8 flex flex-wrap gap-3">
					<Link to="/orders" className="btn btn-primary">
						View orders
					</Link>
					<Link to="/routes" className="btn btn-soft">
						Plan a route
					</Link>
				</div>
			</div>

			<div className="bg-base-200 border-base-content/20 relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border p-6 shadow-lg sm:p-10">
				<div className="bg-primary/15 absolute -top-16 -right-16 size-48 rounded-full" />
				<div className="bg-accent/20 absolute -bottom-20 -left-20 size-56 rounded-full" />
				<img
					src={locationPath}
					alt="Delivery locations connected by a route"
					className="relative mx-auto h-auto w-full max-w-sm"
				/>
			</div>
		</section>
	);
}

export default MainContent;
