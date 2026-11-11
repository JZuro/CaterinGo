import type { Order } from "../types/Order";

export const orderData: Order[] = [
	{
		id: 1001,
		status: "delivered",

		address: {
			id: 1,
			street: "al. 3 Maja 1",
			apartment: "—",
			city: "Kraków",
			postal_code: "30-062",
		},

		items: [
			{
				id: 2001,
				meal: {
					id: 1,
					name: "Sport",
				},
				quantity: 1,
			},
			{
				id: 2002,
				meal: {
					id: 2,
					name: "Standard",
				},
				quantity: 1,
			},
		],
	},
	{
		id: 1002,
		status: "delivered",

		address: {
			id: 4,
			street: "św. Marka 17",
			apartment: "—",
			city: "Kraków",
			postal_code: "31-018",
		},

		items: [
			{
				id: 2003,
				meal: {
					id: 1,
					name: "Sport",
				},
				quantity: 1,
			},
			{
				id: 2004,
				meal: {
					id: 2,
					name: "Standard",
				},
				quantity: 1,
			},
		],
	},
	{
		id: 1003,
		status: "pending",

		address: {
			id: 5,
			street: "Pijarska 8",
			apartment: "—",
			city: "Kraków",
			postal_code: "31-015",
		},

		items: [
			{
				id: 2005,
				meal: {
					id: 3,
					name: "Vegetarian",
				},
				quantity: 1,
			},
		],
	},
	{
		id: 1004,
		status: "cancelled",

		address: {
			id: 18,
			street: "Gronostajowa 5",
			apartment: "—",
			city: "Kraków",
			postal_code: "30-387",
		},

		items: [
			{
				id: 2006,
				meal: {
					id: 4,
					name: "Low carb",
				},
				quantity: 1,
			},
		],
	},
];
