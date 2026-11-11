import type { Order } from "../types/Order";
import { addressData } from "./addressData";

export const orderData: Order[] = [
	{
		id: 1001,
		status: "delivered",

		address: addressData[0],

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

		address: addressData[3],

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

		address: addressData[4],

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

		address: addressData[17],

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
