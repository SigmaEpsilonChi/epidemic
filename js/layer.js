function Layer(spec){
    var {
        name = "New Layer",
        
        parent = null,
        canvas = null,
        
        width = null,
        height = width,
        
        layerIndex = 0,
    } = spec;

    var children = [];
    var components = [];
    var dirty = true;

    var collisions = [];
    var collideCounter = 0;
    var collideWeave = 2;

    var offset = {
        x: 0,
        y: 0,
    }

    if (width == null || height == null) {
        if (canvas != null) {
            width = canvas.width;
            height = canvas.height;
        }
        else if (parent != null) {
            width = parent.width;
            height = parent.height;
        }
    }
    else if (canvas != null) {
        canvas.width = width;
        canvas.height = height;
    }

    if (canvas == null) {
        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
    }

    var context = canvas.getContext('2d');

    var focusComponent = null;
    var clickComponent = null;
    var dragComponent = null;

    var draw = function(parentContext){
        //console.log("%s is drawing", name);
        if (dirty) {
            //console.log("%s is redrawing %s components and %s children.", name, components.length, children.length);
            clear();
            for (var i = 0; i < children.length; i++) {
                children[i].draw(context);
            }
            for (var i = 0; i < components.length; i++) {
                if (components[i].draw) components[i].draw(context);
            }
        }

        if (parentContext != null) {
            parentContext.drawImage(canvas, offset.x, offset.y);
            //console.log("%s is drawing its canvas to %s", name, parent.name);
        }
        dirty = false;
    }

    var update = function(time, timeDelta){
        //console.log("%s is updating", name);
        for (var i = 0; i < components.length; i++) {
            if (components[i].update) dirty = (components[i].update(time, timeDelta) == true) || dirty;
        }
        for (var i = 0; i < children.length; i++) {
            dirty = (children[i].update(time, timeDelta) == true) || dirty;
        }

        if (collideCounter%collideWeave == 0) dirty = collide() || dirty;
        collideCounter++;

        return dirty;
    }

    var setOffset = function(x, y){
        offset.x = x;
        offset.y = y;
        dirty = true;
    }

    var clear = function(){
        context.clearRect(0, 0, width, height);
    }

    var addComponent = function(component){
        dirty = true;
        components.push(component);
        //console.log("%s: adding component #%s", name, components.length);
    }

    var removeComponent = function(component){
        dirty = true;
        var index = components.indexOf(component);
        if (index >= 0) components.splice(index, 1);
    }

    var clearComponents = function(){
        dirty = true;
        components.length = 0;
    }

    var addChild = function(child){
        dirty = true;
        children.push(child);
        sortChildren();
    }

    var removeChild = function(child){
        dirty = true;
        var index = children.indexOf(child);
        if (index >= 0) children.splice(index, 1);
    }

    var refresh = function(){
        dirty = true;
    }

    var sortChildren = function(){
        children.sort(function(a, b){
            return a.layerIndex-b.layerIndex;
        });
    }

    var collide = function(){
        var tr = false;
        var c0;
        var c1;
        var collision;
        for (var i = 0; i < components.length; i++) {
            c0 = components[i];
            if (c0.collide) {
                for (var j = i+1; j < components.length; j++) {
                    c1 = components[j];
                    if (c1.collide) {
                        collision = getCollision(c0, c1);
                        if (c0.collide(c1)) {
                            if (collision == null) {
                                collision = Collision({
                                    objectA: c0,
                                    objectB: c1,
                                });
                                collisions.push(collision);
                                if (c0.onCollisionEnter) tr = c0.onCollisionEnter(collision) || tr;
                                if (c1.onCollisionEnter) tr = c1.onCollisionEnter(collision) || tr;
                            }
                            else {
                                if (c0.onCollisionStay) tr = c0.onCollisionStay(collision) || tr;
                                if (c1.onCollisionStay) tr = c1.onCollisionStay(collision) || tr;
                            }
                        }
                        else if (collision != null) {
                            if (c0.onCollisionExit) tr = c0.onCollisionExit(collision) || tr;
                            if (c1.onCollisionExit) tr = c1.onCollisionExit(collision) || tr;
                            collisions.splice(collisions.indexOf(collision), 1);
                        }
                    }
                }
            }
        }
        return tr;
    }

    var getCollision = function(a, b){
        for (var i = 0; i < collisions.length; i++) {
            if (collisions[i].contains(a, b)) return collisions[i];
        }
        return null;
    }

    var onMouseDown = function(event){
        for (var i = 0; i < components.length; i++) {
            if (components[i].onMouseDown) dirty = components[i].onMouseDown(event) || dirty;
        }
        for (var i = 0; i < children.length; i++) {
            dirty = (children[i].onMouseDown(event) == true) || dirty;
        }

        if (clickComponent != null && clickComponent.onClickUp) {
            dirty = clickComponent.onClickUp(event) || dirty;
        }

        if (focusComponent != null && focusComponent.onClickDown) {
            clickComponent = focusComponent;
            dirty = clickComponent.onClickDown(event) || dirty;
        }
        if (focusComponent != null && focusComponent.onDragStart) {
            dragComponent = focusComponent;
            dirty = dragComponent.onDragStart(event) || dirty;
        }
        return dirty;
    }

    var onMouseUp = function(event){
        for (var i = 0; i < components.length; i++) {
            if (components[i].onMouseUp) dirty = components[i].onMouseUp(event) || dirty;
        }
        for (var i = 0; i < children.length; i++) {
            dirty = (children[i].onMouseUp(event) == true) || dirty;
        }

        if (clickComponent != null && clickComponent.onClickUp) {
            dirty = clickComponent.onClickUp(event) || dirty;
            clickComponent = null;
        }
        if (dragComponent != null && dragComponent.onDragEnd) {
            dirty = dragComponent.onDragEnd(event) || dirty;
            dragComponent = null;
        }
        return dirty;
    }

    var onMouseMove = function(event){
        for (var i = 0; i < components.length; i++) {
            if (components[i].onMouseMove) dirty = components[i].onMouseMove(event) || dirty;
        }
        for (var i = 0; i < children.length; i++) {
            dirty = (children[i].onMouseMove(event) == true) || dirty;
        }
        if (dragComponent != null && dragComponent.onDragMove) {
            dirty = dragComponent.onDragMove(event) || dirty;
        }

        var component;
        for (var i = components.length-1; i >= 0; i--) {
            component = components[i];
            if (component.overlap && (component.onFocusEnter && component.onFocusExit)) {
                var overlap = component.overlap(event.clientX, event.clientY);
                if (overlap && focusComponent != component) {
                    if (focusComponent != null) dirty = focusComponent.onFocusExit(event) || dirty;
                    dirty = component.onFocusEnter(event) || dirty;
                    focusComponent = component;
                    break;
                }
                else if (overlap) break;
                // else if (!overlap && focusComponent == component) {
                //     dirty = component.onFocusExit(event) || dirty;
                //     focusComponent = null;
                // }
            }
            if (i == 0 && focusComponent != null) {
                dirty = focusComponent.onFocusExit(event) || dirty;
                focusComponent = null;
            }
        }


        return dirty;
    }

    var onTouchStart = function(event){
        event.preventDefault();
        var touch = event.touches[0];

        var mouseEvent = new MouseEvent("mousedown", {
            clientX: touch.clientX,
            clientY: touch.clientY,
        });
        canvas.dispatchEvent(mouseEvent);
    }

    var onTouchEnd = function(event){
        var mouseEvent = new MouseEvent("mouseup");
        canvas.dispatchEvent(mouseEvent);
    }

    var onTouchMove = function(event){
        event.preventDefault();
        var touch = event.touches[0];

        var mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY,
        });
        canvas.dispatchEvent(mouseEvent);
    }

    var onTouchCancel = function(event){
        var mouseEvent = new MouseEvent("mouseup");
        canvas.dispatchEvent(mouseEvent);
    }
    
    var onPointerEnter = function(event){
        for (var i = 0; i < components.length; i++) {
            if (components[i].onPointerEnter) dirty = components[i].onPointerEnter(event) || dirty;
        }
        for (var i = 0; i < children.length; i++) {
            dirty = (children[i].onPointerEnter(event) == true) || dirty;
        }
    }

    var onPointerExit = function(event){
        for (var i = 0; i < components.length; i++) {
            if (components[i].onPointerExit) dirty = components[i].onPointerExit(event) || dirty;
        }
        for (var i = 0; i < children.length; i++) {
            dirty = (children[i].onPointerExit(event) == true) || dirty;
        }
    }

    var destroy = function(){
        parent.removeChild(this);
    }

    var tr = Object.freeze({
        // Fields
        name,
        width,
        height,
        layerIndex,

        // Methods
        draw,
        update,
        destroy,
        refresh,

        setOffset,

        addComponent,
        removeComponent,
        clearComponents,

        addChild,
        removeChild,

        onMouseMove,
        onMouseDown,
        onMouseUp,

        onPointerEnter,
        onPointerExit,
    });

    console.log("Creating layer: %s", name);
    if (parent != null) {
        console.log("Adding %s to %s children", name, parent.name);
        parent.addChild(tr);
    }
    else {
        canvas.addEventListener("mouseenter", onPointerEnter, false);
        canvas.addEventListener("mouseleave", onPointerExit, false);
        canvas.addEventListener("mouseout", onPointerExit, false);

        canvas.addEventListener("mousedown", onMouseDown, false);
        canvas.addEventListener("mouseup", onMouseUp, false);
        canvas.addEventListener("mousemove", onMouseMove, false);

        canvas.addEventListener("touchstart", onTouchStart, false);
        canvas.addEventListener("touchend", onTouchEnd, false);
        canvas.addEventListener("touchcancel", onTouchCancel, false);
        canvas.addEventListener("touchmove", onTouchMove, false);

        canvas.addEventListener("pointerenter", onPointerEnter, false);
        canvas.addEventListener("pointerexit", onPointerExit, false);
    }

    return tr;
}