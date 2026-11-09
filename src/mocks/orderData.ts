import type { Order } from "../types/Order";

export const orderData: Order[] = [
	{
		id: 1001,
		status: "delivered",

		address: {
			id: 1,
			street: "al. 3 Maja 1",
		},

		items: [
			{
				meal: {
					id: 1,
					name: "Sport",
				},
				quantity: 1,
			},
			{
				meal: {
					id: 2,
					name: "Standard",
				},
				quantity: 1,
			},
		],
	},
	{
		id: 1001,
		status: "delivered",

		address: {
			id: 4,
			street: "św. Marka 17",
		},

		items: [
			{
				meal: {
					id: 1,
					name: "Sport",
				},
				quantity: 1,
			},
			{
				meal: {
					id: 2,
					name: "Standard",
				},
				quantity: 1,
			},
		],
	},
	{
		id: 1001,
		status: "pending",

		address: {
			id: 5,
			street: "Pijarska 8",
		},

		items: [
			{
				meal: {
					id: 1,
					name: "Vegetarian",
				},
				quantity: 1,
			},
		],
	},
	{
		id: 1001,
		status: "cancelled",

		address: {
			id: 18,
			street: "Gronostajowa 5",
		},

		items: [
			{
				meal: {
					id: 1,
					name: "Low carb",
				},
				quantity: 1,
			},
		],
	},
];
