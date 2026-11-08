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
];
