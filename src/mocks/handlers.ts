import { HttpResponse, http } from "msw/http";
import { addressData } from "./addressData";

export const handlers = [
	http.get("/api/addresses", () => {
		return HttpResponse.json(addressData);
	}),
];
