import React from "react";


export function IonCalculator(props: React.ComponentPropsWithoutRef<'svg'>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"
			 viewBox="0 0 512 512" {...props}>
			{/* Icon from IonIcons by Ben Sperry - https://github.com/ionic-team/ionicons/blob/main/LICENSE */}
			<path fill="currentColor"
				  d="M416 80a48.05 48.05 0 0 0-48-48H144a48.05 48.05 0 0 0-48 48v352a48.05 48.05 0 0 0 48 48h224a48.05 48.05 0 0 0 48-48ZM168 432a24 24 0 1 1 24-24a24 24 0 0 1-24 24m0-80a24 24 0 1 1 24-24a24 24 0 0 1-24 24m0-80a24 24 0 1 1 24-24a24 24 0 0 1-24 24m88 160a24 24 0 1 1 24-24a24 24 0 0 1-24 24m0-80a24 24 0 1 1 24-24a24 24 0 0 1-24 24m0-80a24 24 0 1 1 24-24a24 24 0 0 1-24 24m112 136a24 24 0 0 1-48 0v-80a24 24 0 0 1 48 0Zm-24-136a24 24 0 1 1 24-24a24 24 0 0 1-24 24m19.31-100.69A16 16 0 0 1 352 176H160a16 16 0 0 1-16-16V96a16 16 0 0 1 16-16h192a16 16 0 0 1 16 16v64a16 16 0 0 1-4.69 11.31"></path>
		</svg>
	)
}