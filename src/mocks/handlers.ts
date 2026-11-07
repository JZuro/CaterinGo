import { HttpResponse, http } from "msw/http";
import { addressData } from "./addressData";
import { mealData } from "./mealData";

export const handlers = [
	http.get("/api/addresses", () => {
		return HttpResponse.json(addressData);
	}),
	http.get("/api/meals", () => {
		return HttpResponse.json(mealData);
	}),
];
