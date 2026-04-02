import React from 'react';

interface CookieSettingsButtonProps {
	className?: string;
	label?: string;
}

const CookieSettingsButton: React.FC<CookieSettingsButtonProps> = ({
	className,
	label = 'Cookie indstillinger'
}) => {
	const handleOpen = () => {
		window.dispatchEvent(new Event('openCookieSettings'));
	};

	return (
		<button
			onClick={handleOpen}
			className={
				className ||
				'fixed bottom-4 right-4 z-40 rounded-full bg-white/10 text-white backdrop-blur-md px-4 py-2.5 text-sm font-medium hover:bg-white/20 transition-all shadow-lg hover:shadow-xl'
			}
			aria-label="Åbn cookie indstillinger"
		>
			{label}
		</button>
	);
};

export default CookieSettingsButton;


