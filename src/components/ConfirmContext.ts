import { createContext, useContext } from "react";

export type ConfirmOptions = {
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	danger?: boolean;
};

export type Confirm = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<Confirm | null>(null);

export const useConfirm = () => {
	const confirm = useContext(ConfirmContext);

	if (!confirm) {
		throw new Error("useConfirm must be used inside ConfirmProvider");
	}

	return confirm;
};
