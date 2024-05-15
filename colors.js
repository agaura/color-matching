/**
 * Applies the gamma function and performs companding to properly convert
 * from the linear sRGB/P3 space to the actual sRGB/P3 space
 * Source: http://www.brucelindbloom.com/index.html?Eqn_XYZ_to_RGB.html
 *
 * @param {number} val - Channel value to be converted
 * @returns {number} - True value
 */
export function gamma(val) {
	return 0.0031308 >= val
		? 12.92 * val
		: 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
}
/**
 * Returns the linear interpolation of x and y based on the interpolation factor a
 *
 * @param {number} x - Start value
 * @param {number} y - End value
 * @param {number} a - Interpolation factor, typically between 0 and 1
 * @returns {number} - Interpolated value
 */
export function mix(x, y, a) {
	return a * y + (1 - a) * x;
}

/**
 * Converts between the CIE 1931 RGB color space to the CIE 1931 XYZ color space
 *
 * @param {[number, number, number]} vec - CIE 1931 RGB color vector
 * @returns {[number, number, number]} - CIE 1931 XYZ color vector
 */
export function RGB1931toXYZ(vec) {
	const [r, g, b] = vec;
	return [
		0.49 * r + 0.31 * g + 0.2 * b,
		0.17697 * r + 0.8124 * g + 0.01063 * b,
		0.0 * r + 0.01 * g + 0.99 * b,
	];
}

/**
 * Converts between the CIE 1931 XYZ color space to the Display P3 color space
 *
 * @param {[number, number, number]} vec - CIE 1931 XYZ color vector
 * @returns {[number, number, number]} - Display P3 color vector
 */
export function XYZtoP3(vec) {
	const [r, g, b] = vec;
	return [
		2.4934969 * r - 0.9313836 * g - 0.4027108 * b,
		-0.829489 * r + 1.7626641 * g + 0.0236247 * b,
		0.0358458 * r - 0.0761724 * g + 0.9568845 * b,
	];
}

/**
 * Finds the displayable version of a slider's color
 *
 * @param {number} sliderVal - Strength of slider
 * @param {[number, number, number]} RGB1931color - Color that the slider represents
 * @param {number} alpha - Interpolation factor
 * @param {number} P3gray - Gray to mix with in order to make displayable
 * @returns {string} - CSS formatted Display P3 color
 */
export function displayableProjection(sliderVal, RGB1931color, alpha, P3gray) {
	const projectedBlack = mix(P3gray, 0, alpha); // find the projection of black
	const P3primary = XYZtoP3(RGB1931toXYZ(RGB1931color)); // find the primary color expressed in P3
    const projectedPrimary = P3primary.map((val) => mix(P3gray, val, alpha)); // find the projection of the primary color
    const P3color = projectedPrimary.map((val) => gamma(mix(projectedBlack, val, sliderVal))); // find the true color corresponding to the slider's value
	return `color(display-p3 ${P3color.join(" ")})` // make color displayable in CSS
}
