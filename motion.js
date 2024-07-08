// How much the box responds to user mouse inputs.
const ACCELERATION_COEFFICIENT = 0.01;

// How much the box slows down on its own over time.
const FRICTION_COEFFICENT = 0.966;

export class Motion {
    #object = null;
	#momentum = null;
	#mouseDown = null;
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
	constructor(object, canvas) {
		this.#object = object;

        canvas.addEventListener("pointerdown", this.#start.bind(this), { passive: false });
        document.addEventListener("pointermove", this.#moveWhileHold.bind(this), { passive: false });
        document.addEventListener("pointerup", this.#release.bind(this), { passive: false });
		//canvas.addEventListener("touchstart", this.#start.bind(this), { passive: false });
        //document.addEventListener("touchmove", this.#moveWhileHold.bind(this), { passive: false });
        //document.addEventListener("touchend", this.#release.bind(this), { passive: false });
	}

	/**
	 * Resets Motion object and initializes starting position
	 *
	 * @param {event} event
	 */
	#start(event) {
        event.preventDefault();
		this.#momentum = false;
		this.#mouseDown = true;
		this.#mouseX = event.clientX;
		this.#events = 0;
		this.#mouseY = event.clientY;
		this.#totalHorizontal = 0;
		this.#totalVertical = 0;

		console.log(this.#mouseX, this.#mouseY);
	}

	/**
	 * Moves object while dragging
	 *
	 * @param {event} event
	 */
	#moveWhileHold(event) {
        if (!this.#mouseDown) { return; }

        event.preventDefault();
		this.#dx = event.clientX - this.#mouseX;
		this.#dy = event.clientY - this.#mouseY;
		this.#mouseX = event.clientX;
		this.#mouseY = event.clientY;
		this.#totalHorizontal += this.#dx;
		this.#totalVertical += this.#dy;
		this.#events++;
		this.#object.rotation.y += this.#dx * ACCELERATION_COEFFICIENT;
		this.#object.rotation.x += this.#dy * ACCELERATION_COEFFICIENT;
	}

	/**
	 * Enables momentum depending on how fast the object was moving upon release
     * 
     * @param {event} event
	 */
	#release(event) {
        event.preventDefault();
		if (this.#mouseDown) {
			this.#mouseDown = false;

			// if last movement was a very small increment, don't bother moving
			if (Math.abs(this.#dx) < 2 && Math.abs(this.#dy) < 2)
				this.#momentum = false;
			// otherwise, enable moving
			else this.#momentum = true;
		}
	}

	/**
	 * Object rotates depending on momentum
	 */
	selfMove() {
		if (this.#momentum && this.#events != 0) {
			this.#object.rotation.y += (this.#totalHorizontal / this.#events) * ACCELERATION_COEFFICIENT;
			this.#object.rotation.x += (this.#totalVertical / this.#events) * ACCELERATION_COEFFICIENT;
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
	environment.motion = new Motion(environment.object, environment.canvas);
}
