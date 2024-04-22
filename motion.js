export function setupMotion(environment) {

    environment.motionComponents = {
        momentum: null,
        mouseDown: null,
        totalHorizontal: null,
        totalVertical: null,
        dx: null,
        dy: null,
        mouseX: null,
        mouseY: null,
        events: null
    };

    environment.canvas.addEventListener('pointerdown', function (event) {
        event.preventDefault();
        environment.motionComponents.momentum = false;
        environment.motionComponents.mouseDown = true;
        environment.motionComponents.mouseX = event.clientX;
        environment.motionComponents.events = 0;
        environment.motionComponents.mouseY = event.clientY;
    }, false);

    document.addEventListener('pointermove', function (event) {
        if (!environment.motionComponents.mouseDown) {return} // is the button pressed?
        event.preventDefault();
        environment.motionComponents.dx = event.clientX - environment.motionComponents.mouseX
        environment.motionComponents.dy = event.clientY - environment.motionComponents.mouseY
        environment.motionComponents.mouseX = event.clientX;
        environment.motionComponents.mouseY = event.clientY;
        environment.motionComponents.totalHorizontal += environment.motionComponents.dx;
        environment.motionComponents.totalVertical += environment.motionComponents.dy;
        environment.motionComponents.events++;
        environment.object.rotation.y += environment.motionComponents.dx * 0.01;
        environment.object.rotation.x += environment.motionComponents.dy * 0.01;
        //if (Math.abs(environment.object.rotation.x) < maxVerticalOrientation) environment.object.rotation.x += environment.motionComponents.dy * 0.01;
        //if (!document.getElementById("verticallock").checked) {
        //    if (environment.motionComponents.dy * environment.object.rotation.x < 0.) environment.object.rotation.x += environment.motionComponents.dy * 0.01;
        //    else environment.object.rotation.x += environment.motionComponents.dy * 0.01 * (maxVerticalOrientation - Math.abs(environment.object.rotation.x));
        //}
        }, false);

    document.addEventListener('pointerup', function (event) {
        event.preventDefault();
        if (environment.motionComponents.mouseDown) {
            environment.motionComponents.mouseDown = false;
            if ((environment.motionComponents.mouseX == event.clientX - environment.motionComponents.dx) && (environment.motionComponents.mouseY == event.clientY - environment.motionComponents.dy)) {
                environment.motionComponents.totalHorizontal = 0;
                environment.motionComponents.totalVertical = 0;
            }
            environment.motionComponents.momentum = true;
        }
    }, false);

    environment.updateRotation = function() {
        if (environment.motionComponents.events != 0){
            environment.object.rotation.y += environment.motionComponents.totalHorizontal / environment.motionComponents.events * 0.01;
            environment.object.rotation.x += environment.motionComponents.totalVertical / environment.motionComponents.events * 0.01;
            //if (!document.getElementById("verticallock").checked) {
            //    if (environment.motionComponents.totalVertical / environment.motionComponents.events * environment.object.rotation.x < 0.) environment.object.rotation.x += environment.motionComponents.totalVertical / environment.motionComponents.events * 0.01;
            //    else environment.object.rotation.x += environment.motionComponents.totalVertical / environment.motionComponents.events * 0.01 * (maxVerticalOrientation - Math.abs(environment.object.rotation.x));
            //}
            environment.motionComponents.totalHorizontal = environment.motionComponents.totalHorizontal * 0.966;
            environment.motionComponents.totalVertical = environment.motionComponents.totalVertical * 0.966;
        }
        else if (Math.abs(environment.motionComponents.totalHorizontal) < 0.5 || Math.abs(environment.motionComponents.totalVertical) < 0.5){
            environment.motionComponents.events = 0;
            environment.motionComponents.momentum = false;
        }
    }
}