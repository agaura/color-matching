// How much the box responds to user mouse inputs.
const ACCELERATION_COEFFICIENT = 0.01;

// How much the box slows down on its own over time.
const FRICTION_COEFFICENT = 0.966;

class Motion {
    object = null;
	momentum = null;
	mouseDown = null;
	#totalHorizontal = null;
	#totalVertical = null;
	#dx = null;
	#dy = null;
	#mouseX = null;
	#mouseY = null;
	#events = null;

	/**
	 * Initializes Motion object with Three.JS object to be rotated
	 *
	 * @param {*} object
	 */
	constructor(object) {
		this.object = object;
	}

	/**
	 * Resets Motion object and initializes starting position
	 *
	 * @param {number} x - Starting x position
	 * @param {number} y - Starting y position
	 */
	start(x, y) {
		this.momentum = false;
		this.mouseDown = true;
		this.#mouseX = x;
		this.#events = 0;
		this.#mouseY = y;
		this.#totalHorizontal = 0;
		this.#totalVertical = 0;
	}

	/**
	 * Moves object while dragging
	 *
	 * @param {number} x - Starting x position
	 * @param {number} y - Starting y position
	 */
	moveWhileHold(x, y) {
		this.#dx = x - this.#mouseX;
		this.#dy = y - this.#mouseY;
		this.#mouseX = x;
		this.#mouseY = y;
		this.#totalHorizontal += this.#dx;
		this.#totalVertical += this.#dy;
		this.#events++;
		this.object.rotation.y += this.#dx * ACCELERATION_COEFFICIENT;
		this.object.rotation.x += this.#dy * ACCELERATION_COEFFICIENT;
	}

	/**
	 * Enables momentum depending on how fast the object was moving upon release
	 */
	release() {
		if (this.mouseDown) {
			this.mouseDown = false;

			// if last movement was a very small increment, don't bother moving
			if (Math.abs(this.#dx) < 2 && Math.abs(this.#dy) < 2)
				this.momentum = false;
			// otherwise, enable moving
			else this.momentum = true;
		}
	}

	/**
	 * Object rotates depending on momentum
	 */
	selfMove() {
		if (this.momentum && this.#events != 0) {
			this.object.rotation.y += (this.#totalHorizontal / this.#events) * ACCELERATION_COEFFICIENT;
			this.object.rotation.x += (this.#totalVertical / this.#events) * ACCELERATION_COEFFICIENT;
			this.#totalHorizontal = this.#totalHorizontal * FRICTION_COEFFICENT;
			this.#totalVertical = this.#totalVertical * FRICTION_COEFFICENT;
		}
	}
}

/**
 * Enables objects in environment to be able to move upon being interacted with
 *
 * @param {*} environment
 */
export function setupMotion(environment) {
	environment.motion = new Motion(environment.object);

	environment.canvas.addEventListener(
		"pointerdown",
		function (event) {
			event.preventDefault();
			environment.motion.start(event.clientX, event.clientY);
		},
		false
	);

	document.addEventListener(
		"pointermove",
		function (event) {
			if (!environment.motion.mouseDown) {
				return;
			} // is the button pressed?
			event.preventDefault();
			environment.motion.moveWhileHold(event.clientX, event.clientY);
		},
		false
	);

	document.addEventListener(
		"pointerup",
		function (event) {
			event.preventDefault();
			environment.motion.release();
		},
		false
	);
}
