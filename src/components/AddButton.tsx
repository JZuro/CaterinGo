type AddButtonProps = {
	label: string;
	onClick: () => void;
};

const AddButton = ({ label, onClick }: AddButtonProps) => (
	<button
		type="button"
		className="btn btn-primary btn-sm btn-square items-center justify-center"
		aria-label={label}
		onClick={onClick}
	>
		<svg
			aria-hidden="true"
			width="1.5em"
			height="1.5em"
			viewBox="0 0 24 24"
		>
			<path
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth={2}
				d="M6 12h12M12 6v12"
			/>
		</svg>
	</button>
);

export default AddButton;
