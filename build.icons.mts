import { readFile, writeFile } from "node:fs/promises"
import { svgToURL, getIconData, iconToSVG, iconToHTML, replaceIDs } from "@iconify/utils"
import { locate } from "@iconify/json"
import type { IconifyJSON } from "@iconify/types"

const buildPath = 'src/Resources/app/storefront/src/assets/css/icons'

/**
 * Icon packs. Outer key is pack name (output CSS basename),
 * inner key is Iconify set prefix, value is array of icon names.
 *
 * @type {Record<string, Record<string, string[]>>}
 */
const icons: Record<string, Record<string, string[]>> = {
  default: {
    ph: [
      "address-book",
      "arrows-in-cardinal",
      "arrow-down",
      "arrow-left",
      "arrow-right",
      "arrow-up",
      "arrow-line-right",
      "broadcast",
      "caret-left",
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
      "user",
      "x",
      "x-circle",
    ],
  },
  bold: {
    ph: [
      "address-book-bold",
      "arrows-in-cardinal-bold",
      "arrow-down-bold",
      "arrow-left-bold",
      "arrow-right-bold",
      "arrow-up-bold",
      "arrow-line-right-bold",
      "broadcast-bold",
      "caret-left-bold",
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
      "squares-four-bold",
      "ticket-bold",
      "user-bold",
      "x-bold",
      "x-circle-bold",
    ],
  },
}

const customIcons: string[] = []

function buildCSSClass(iconUrl: string, iconName: string, pack: string) {
	const className = `icon-${iconName}`
	return `.${className} {\n \t--svg: ${iconUrl}; \n}`;
}

async function buildCSS(pack: string, packIcons: Record<string, string[]>) {
	const code: string[] = [];
	for (const [setId, iconsArray] of Object.entries(packIcons)) {
		const iconSet: IconifyJSON = JSON.parse(await readFile(locate(setId), 'utf8'));
		for (const icon of iconsArray) {
			const iconData = getIconData(iconSet, icon);

			if (!iconData) {
				throw new Error(`Icon "${icon}" is missing in pack "${pack}"`);
			}

			const iconRendered = iconToSVG(iconData, {
				height: 'auto',
			});

			const iconSvg = iconToHTML(replaceIDs(iconRendered.body), iconRendered.attributes as Record<string, string>);

			const iconUrl = svgToURL(iconSvg);

			code.push(buildCSSClass(iconUrl, icon, pack));
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
