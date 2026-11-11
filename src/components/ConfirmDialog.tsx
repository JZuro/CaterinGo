import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type PropsWithChildren,
} from "react";
import {
	ConfirmContext,
	type Confirm,
	type ConfirmOptions,
} from "./ConfirmContext";

type ConfirmationRequest = ConfirmOptions & {
	resolve: (confirmed: boolean) => void;
};

type ConfirmDialogProps = ConfirmOptions & {
	open: boolean;
	onConfirm: () => void;
	onCancel: () => void;
};

const ConfirmDialog = ({
	open,
	title,
	message,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	danger = false,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) => {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;

		if (!dialog) {
			return;
		}

		if (open && !dialog.open) {
			dialog.showModal();
		} else if (!open && dialog.open) {
			dialog.close();
		}
	}, [open]);

	return (
		<dialog
			ref={dialogRef}
			className="bg-base-100 text-base-content m-auto w-[min(28rem,calc(100%-2rem))] rounded-xl p-0 shadow-xl backdrop:bg-black/50"
			onCancel={(event) => {
				event.preventDefault();
				onCancel();
			}}
			onClick={(event) => {
				if (event.target === event.currentTarget) {
					onCancel();
				}
			}}
		>
			<div className="p-5 text-left">
				<h2 className="mb-2">{title}</h2>
				<p>{message}</p>

				<div className="mt-6 flex justify-end gap-2">
					<button
						type="button"
						className="btn btn-soft"
						onClick={onCancel}
					>
						{cancelLabel}
					</button>
					<button
						type="button"
						className={danger ? "btn btn-error" : "btn btn-primary"}
						onClick={onConfirm}
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</dialog>
	);
};

export const ConfirmProvider = ({ children }: PropsWithChildren) => {
	const [request, setRequest] = useState<ConfirmationRequest | null>(null);
	const requestRef = useRef<ConfirmationRequest | null>(null);

	const confirm = useCallback<Confirm>((options) => {
		return new Promise((resolve) => {
			if (requestRef.current) {
				resolve(false);
				return;
			}

			const nextRequest = { ...options, resolve };
			requestRef.current = nextRequest;
			setRequest(nextRequest);
		});
	}, []);

	const finishConfirmation = useCallback((confirmed: boolean) => {
		const currentRequest = requestRef.current;

		requestRef.current = null;
		setRequest(null);
		currentRequest?.resolve(confirmed);
	}, []);

	return (
		<ConfirmContext.Provider value={confirm}>
			{children}
			<ConfirmDialog
				open={request !== null}
				title={request?.title ?? ""}
				message={request?.message ?? ""}
				confirmLabel={request?.confirmLabel}
				cancelLabel={request?.cancelLabel}
				danger={request?.danger}
				onConfirm={() => finishConfirmation(true)}
				onCancel={() => finishConfirmation(false)}
			/>
		</ConfirmContext.Provider>
	);
};
