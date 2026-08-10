import { readFile, writeFile } from "node:fs/promises"
import { svgToURL, getIconData, iconToSVG, iconToHTML, replaceIDs } from "@iconify/utils"
import { locate } from "@iconify/json"
import type { IconifyJSON } from "@iconify/types"

const buildPath = 'src/Resources/app/storefront/src/assets/css/icons'

/** Iconify name, or object with source name + custom CSS class suffix (after `icon-`). */
type IconEntry = string | { icon: string; class: string }

/**
 * Icon packs. Outer key is pack name (output CSS basename),
 * inner key is Iconify set prefix, value is array of icon entries.
 * String entries use the Iconify name as the CSS class suffix.
 */
const icons: Record<string, Record<string, IconEntry[]>> = {
  default: {
    ph: [
      "address-book",
      "arrows-in-cardinal",
      "arrows-out",
      "arrow-counter-clockwise",
      "arrow-down",
      "arrow-left",
      "arrow-right",
      "arrow-up",
      "arrow-line-right",
      "broadcast",
      "caret-left",
      "caret-line-down",
      "caret-line-left",
      "caret-line-right",
      "caret-line-up",
      "caret-right",
      "caret-down",
      "caret-up",
      "check",
      "chart-line-up",
      "circle",
      "circle-fill",
      "circles-three-plus",
      "code",
      "flow-arrow",
      "globe",
      "handbag",
      "handshake",
      "heart",
      "heart-fill",
      "info",
      "list",
      "magnifying-glass",
      "minus",
      "number-circle-one",
      "package",
      "paper-plane-right",
      "pencil-simple-line",
      "plus",
      "rocket-launch",
      "ruler",
      "sliders",
      "sparkle",
      "speedometer",
      "stack-plus",
      "squares-four",
      "ticket",
      "trash",
      "truck",
      "user",
      "x",
      "x-circle",
    ],
  },
  bold: {
    ph: [
      "address-book-bold",
      "arrows-in-cardinal-bold",
      "arrows-out-bold",
      "arrow-counter-clockwise-bold",
      "arrow-down-bold",
      "arrow-left-bold",
      "arrow-right-bold",
      "arrow-up-bold",
      "arrow-line-right-bold",
      "broadcast-bold",
      "caret-left-bold",
      "caret-line-down-bold",
      "caret-line-left-bold",
      "caret-line-right-bold",
      "caret-line-up-bold",
      "caret-right-bold",
      "caret-down-bold",
      "caret-up-bold",
      "check-bold",
      "chart-line-up-bold",
      "circle-bold",
      "circle-fill",
      "circles-three-plus-bold",
      "code-bold",
      "flow-arrow-bold",
      "globe-bold",
      "handbag-bold",
      "handshake-bold",
      "heart-bold",
      "heart-fill",
      "info-bold",
      "list-bold",
      "magnifying-glass-bold",
      "minus-bold",
      "number-circle-one-bold",
      "package-bold",
      "paper-plane-right-bold",
      "pencil-simple-line-bold",
      "plus-bold",
      "rocket-launch-bold",
      "ruler-bold",
      "sliders-bold",
      "sparkle-bold",
      "speedometer-bold",
      "stack-plus-bold",
      "star-bold",
      {
        icon: "star-fill",
        class: "star-fill-bold",
      },
      {
        icon: "star-half-fill",
        class: "star-half-fill-bold",
      },
      "squares-four-bold",
      "ticket-bold",
      "trash-bold",
      "truck-bold",
      "user-bold",
      "x-bold",
      "x-circle-bold",
    ],
  },
}

function resolveIconEntry(entry: IconEntry, pack: string): { icon: string; className: string } {
	if (typeof entry === 'string') {
		return { icon: entry, className: entry }
	}

	if (!entry?.icon || !entry?.class) {
		throw new Error(`Invalid icon entry in pack "${pack}": expected string or { icon, class }`)
	}

	return { icon: entry.icon, className: entry.class }
}

function buildCSSClass(iconUrl: string, className: string) {
	return `.icon-${className} {\n \t--svg: ${iconUrl}; \n}`;
}

async function buildCSS(pack: string, packIcons: Record<string, IconEntry[]>) {
	const code: string[] = [];
	for (const [setId, iconsArray] of Object.entries(packIcons)) {
		const iconSet: IconifyJSON = JSON.parse(await readFile(locate(setId), 'utf8'));
		for (const entry of iconsArray) {
			const { icon, className } = resolveIconEntry(entry, pack)
			const iconData = getIconData(iconSet, icon);

			if (!iconData) {
				throw new Error(`Icon "${icon}" is missing in pack "${pack}"`);
			}

			const iconRendered = iconToSVG(iconData, {
				height: 'auto',
			});

			const iconSvg = iconToHTML(replaceIDs(iconRendered.body), iconRendered.attributes as Record<string, string>);

			const iconUrl = svgToURL(iconSvg);

			code.push(buildCSSClass(iconUrl, className));
		}
	}
	return code.join('\n');
}

async function buildAll() {
	for (const [pack, packIcons] of Object.entries(icons)) {
		const result = await buildCSS(pack, packIcons)
		await writeFile(`${buildPath}/${pack}.css`, result, 'utf8')
		console.log(`Saved CSS for pack "${pack}"`)
	}
}

buildAll()
