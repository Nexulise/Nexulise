import { set } from 'lodash';
import React, { useLayoutEffect, useState, useContext } from 'react';
import rough from 'roughjs/bundled/rough.esm';
import { Context } from '../Store';

const generator = rough.generator();
var connectionEllipse;

// Feature toggles
const drawingEnabled = true;
const movingEnabled = true;
const hoveringEnabled = true;
const resizingEnabled = true;

// Application properties
const elementColor = '#8ccbe6';//"#FF5A5A";
const lineColor = '#e0c689';
const accentColor = '#afedc0';
const connectColor = '#ed7ee9';
const offSetToPoint = 5;
const connectionEllipseHeight = 10;
const connectionEllipseWidth = 10;
const connectionEllipseFill = '#ffffff';
const connectionEllipseFillStyle = 'solid';
const connectionEllipseStroke = '#ffffff';
const connectionPointDistance = 10;

function CanvasComponent(props) {
    const [elements, setElements] = useState([]);
    const [connectionPoints, setConnectionPoints] = useState([]);
    const [action, setAction] = useState('none');  
    const [activeTool, setActiveTool] = useContext(Context);
    const [selectedElement, setSelectedElement] = useState(null);
    const [hoveredElement, setHoveredElement] = useState(null);
    const [connectableElement, setConnectableElement] = useState(null);
    const [cursor, setCursor] = useState('default');

    useLayoutEffect(() => {
        const canvas = document.getElementById('main_canvas');
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

        const roughCanvas = rough.canvas(canvas);
        
        elements.forEach(({roughElement}) => roughCanvas.draw(roughElement));
        drawConnectionPoints(roughCanvas);
        if(connectionEllipse) roughCanvas.draw(connectionEllipse.element);
    }, [elements, connectionPoints, connectionEllipse], );

    function CreateNewElement(id, x1, y1, x2, y2, strokeColor, type){
        if(!type) type = activeTool;
        var roughElement;
        switch(type) {
        case 'rectangle':
            generator.ellipse(x1, y1, 100, 100, {
                fill: 'red', 
                stroke: strokeColor, 
                fillStyle: connectionEllipseFillStyle});
            roughElement = generator.rectangle(x1,y1,x2-x1,y2-y1, {stroke: strokeColor});
            break;
        case 'line':
            if(strokeColor === elementColor) strokeColor = lineColor;
            roughElement = generator.line(x1,y1,x2,y2, {stroke: strokeColor});
            break;
        case 'selection':
            return null;
            break;
        default:
            break;
        }
        
        return {id, x1, y1, x2, y2, type, strokeColor, roughElement};
    }

    function createNewEllipse(id, x, y, h, w, strokeColor, fill) {
        const element = generator.ellipse(x, y, w, h, {
            fill: fill, 
            stroke: strokeColor, 
            fillStyle: connectionEllipseFillStyle});
        return {id, x, y, h, w, strokeColor, fill, element};
    }

    function distance(a, b) {
        const res = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
        return res;
    }

    function isWithinElement(mouseX, mouseY, element) {
        const {type, x1, x2, y1, y2} = element;
        

        switch(type) {
            case "rectangle":
                const nw = {x: x1, y: y1};
                const ne = {x: x2, y: y1};
                const sw = {x: x1, y: y2};
                const se = {x: x2, y: y2}; 
                const pos = { x: mouseX, y: mouseY };

                const minX = Math.min(x1, x2);
                const minY = Math.min(y1, y2);
                const maxX = Math.max(x1, x2);
                const maxY = Math.max(y1, y2);

                // Check if mouse is in corner (or 1 pixel off)
                const nwPoint = nearPoint(mouseX, mouseY, x1, y1, offSetToPoint, "nw-resize");
                const nePoint = nearPoint(mouseX, mouseY, x2, y1, offSetToPoint, "ne-resize");
                const swPoint = nearPoint(mouseX, mouseY, x1, y2, offSetToPoint, "sw-resize");
                const sePoint = nearPoint(mouseX, mouseY, x2, y2, offSetToPoint, "se-resize");
                
                const nLine = isPosOnLine(pos, nw, ne, "n-resize");
                const eLine = isPosOnLine(pos, ne, se, "e-resize");
                const sLine = isPosOnLine(pos, se, sw, "s-resize");
                const wLine = isPosOnLine(pos, sw, nw, "w-resize");
                
                // Check if mouse is within rectangle
                const inside = mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY ? "move" : null;

                return nwPoint || nePoint || swPoint || sePoint || nLine || eLine || sLine || wLine || inside;
                // return {cursor: "move", result: result};
            case "line":
                const a = { x: x1, y: y1 };
                const b = { x: x2, y: y2 };
                const c = { x: mouseX, y: mouseY };

                // console.log("c: " + c.x + ", " + c.y + " a: " + a.x + ", " + a.y);
                const startLine = nearPoint(mouseX, mouseY, x1, y1, offSetToPoint, "startLine");
                const endLine = nearPoint(mouseX, mouseY, x2, y2, offSetToPoint, "endLine");
                const onLine = isPosOnLine(c, a, b, "move");

                return startLine || endLine || onLine;
            
            default:
                console.log("no type");
                break;
        }      
    }

    function nearPoint(x, y, x1, y1, offset, name){
        return (Math.abs(x- x1) < offset) && (Math.abs(y - y1) < offset) ? name : null;
    }

    function isPosOnLine(pos, startLine, endLine, name){
        const offset = distance(startLine, endLine) - (distance(startLine, pos) + distance(endLine, pos));
        const onLine = Math.abs(offset) < 1;
        return onLine ? name : null;
    }

    /**
     * input:
     * (x1, y1) -> random point
     * (x2, y2) & (x3, y3) two ends of a line
     * output:
     * 0 -> x2, y2 is closest to x1, y1
     * 1 -> x3, y3 is closest to x1, y1
     */
    function getClosestToPoint(x1, y1, x2, y2, x3, y3){
        const distanceA = distance({x: x1, y: y1}, {x: x2, y: y2});//Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        const distanceB = distance({x: x1, y: y1}, {x: x3, y: y3});//Math.sqrt(Math.pow(x1 - x3, 2) + Math.pow(y1 - y3, 2));
        console.log(distanceA + " " + distanceB);
        if(distanceA > distanceB) return 0;
        return 1;
    }

    function getElementAtMousePosition (mouseX, mouseY, elements) {

        return elements
            .map(element => ({...element, position: isWithinElement(mouseX, mouseY, element)}))
            .find(element => element.position !== null);
    }

    function highlightElement(element) {
        recolorElement(element, accentColor);
    }

    function selectElementToEdit(element) {
        recolorElement(element, accentColor);
        showConnectionPointsOnElement(element);
    }

    function unSelectElementToEdit(element) {
        recolorElement(element, elementColor);
        hideConnectionPointsOnElement();
    }

    function unHighlightElement(element) {
        recolorElement(element, elementColor);
        hideConnectionPointsOnElement();
    }

    /**
     * shows circles to show where to start a line from to connect to other elements
     * @param {*} element 
     */
    function showConnectionPointsOnElement(element){
        if(!element) return -1;
        if(element.type !== 'rectangle') return -1;

        const { x1, y1, x2, y2 } = element;
        // addConnectionPoint(createNewEllipse(0, x1, y1, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseFill)); // nw
        // addConnectionPoint(createNewEllipse(1, x2, y1, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseFill)); // ne
        // addConnectionPoint(createNewEllipse(2, x1, y2, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseFill)); // sw
        // addConnectionPoint(createNewEllipse(3, x2, y2, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseFill)); // se
        // addConnectionPoint(createNewEllipse(4, (x1 + x2) / 2, y1, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseFill)); // n
        // addConnectionPoint(createNewEllipse(5, x2, (y1 + y2) / 2, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseFill)); // e
        // addConnectionPoint(createNewEllipse(6, (x1 + x2) / 2, y2, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseFill)); // s
        // addConnectionPoint(createNewEllipse(7, x1, (y1 + y2) / 2, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseFill)); // w
    
        const nw = createNewEllipse(0, x1-connectionPointDistance, y1-connectionPointDistance, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseFill);
        const ne = createNewEllipse(1, x2+connectionPointDistance, y1-connectionPointDistance, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseFill);
        const sw = createNewEllipse(2, x1-connectionPointDistance, y2+connectionPointDistance, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseFill);
        const se = createNewEllipse(3, x2+connectionPointDistance, y2+connectionPointDistance, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseFill);
        const n = createNewEllipse(4, (x1 + x2) / 2, y1-connectionPointDistance, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseFill);
        const e = createNewEllipse(5, x2+connectionPointDistance, (y1 + y2) / 2, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseFill);
        const s = createNewEllipse(6, (x1 + x2) / 2, y2+connectionPointDistance, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseFill);
        const w = createNewEllipse(7, x1-connectionPointDistance, (y1 + y2) / 2, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseFill);

        setConnectionPoints([nw, ne, sw, se, n, e, s, w]);
        // addConnectionPoint(nw);
        // addConnectionPoint(ne);
        // addConnectionPoint(sw);
    }

    /**
     * hides circles to show where to start a line from to connect to other elements
     */
    function hideConnectionPointsOnElement(){
        clearConnectionPoints();
    }

    function showConnectionPointOnElement(position, element) {
        const {x1, y1, x2, y2, type} = element;

        switch(position){
            case "nw-resize":
                updateConEllipse(x1, y1, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseStroke, connectionEllipseFill);
                break;
            case "ne-resize":
                console.log("Drawing connection ellipse ne");
                updateConEllipse(x2, y1, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseStroke, connectionEllipseFill);
                break;
            case "se-resize":
                updateConEllipse(x2, y2, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseStroke, connectionEllipseFill);
                break;
            case "sw-resize":
                updateConEllipse(x1, y2, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseStroke, connectionEllipseFill);
                break;
            case "s-resize":
                updateConEllipse((x1 + x2) / 2, y2, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseStroke, connectionEllipseFill);
                break;
            case "n-resize":
                updateConEllipse((x1 + x2) / 2, y1, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseStroke, connectionEllipseFill);
                break;
            case "e-resize":
                updateConEllipse(x2, (y1 + y2) / 2, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseStroke, connectionEllipseFill);
                break;
            case "w-resize":
                updateConEllipse(x1, (y1 + y2) / 2, connectionEllipseHeight, connectionEllipseWidth, connectionEllipseStroke, connectionEllipseFill);
                break;
        }
    }

    function updateElement(id, x1, y1, x2, y2, color, type) {
        const updatedElement = CreateNewElement(id, x1, y1, x2, y2, color, type);
        
        if(updatedElement) addElement(updatedElement);
    }

    function updateConEllipse(x, y, h, w, stroke, fill) {
        const updatedEllipse = createNewEllipse(0, x, y, h, w, stroke, fill);
        if(updatedEllipse) connectionEllipse = updatedEllipse;
        // if(updatedEllipse) addConEllipse(updatedEllipse);
    }

    function resizedCoordinates(mouseX, mouseY, position, coordinates) {
        const { x1, y1, x2, y2 } = coordinates;
        switch(position) {
            case "nw-resize":
            case "startLine":
                return { x1: mouseX, y1: mouseY, x2, y2 };
            case "ne-resize":
                return { x1, y1: mouseY, x2: mouseX, y2 };
            case "se-resize":
            case "endLine":
                return { x1, y1, x2: mouseX, y2: mouseY };
            case "sw-resize":
                return { x1: mouseX, y1, x2, y2: mouseY};
            case "s-resize":
                return {x1, y1, x2, y2: mouseY};
            case "n-resize":
                return {x1, y1: mouseY, x2, y2};
            case "e-resize":
                return {x1, y1, x2: mouseX, y2};
            case "w-resize":
                return {x1: mouseX, y1, x2, y2};
            default:
                return { x1, y1, x2, y2 };
        }
    }

    function setCursorForLine(name) {
        return name === "startLine" || name === "endLine" ? "pointer" : name;
    }

    function adjustElementCoordinates(element){
        const {type, x1, y1, x2, y2} = element;

        if(type === 'rectangle') {
            const minX = Math.min(x1, x2);
            const minY = Math.min(y1, y2);
            const maxX = Math.max(x1, x2);
            const maxY = Math.max(y1, y2); 
            return{x1: minX, y1: minY, x2: maxX, y2: maxY};
        } else {
            if(x1 < x2 || (x1 === x2 && y1 < y2)) {
                return {x1, y1, x2, y2};
            } else {
                return {x1: x2, y1: y2, x2: x1, y2: y1};
            }
        }
    }

    function recolorElement(element, color){
        const {id, x1, x2, y1, y2, type} = element;
        const recoloredElement = CreateNewElement(id, x1, y1, x2, y2, color, type);
        if(recoloredElement) addElement(recoloredElement);
    }

    function handleDrawing(event) {
        if(!drawingEnabled) return;
        if(action === 'drawing') {
            const{clientX, clientY} = event;
            const index = elements.length - 1;
            const{x1, y1} = elements[index];
            updateElement(index, x1, y1, clientX, clientY, elementColor);
        }
    }

    function handleMoving(event) {
        const{clientX, clientY} = event;
        if(!movingEnabled) return;
        if(action === 'moving') {
            // unSelectElementToEdit(selectedElement);
            setHoveredElement(null);

            const { id, x1, x2, y1, y2, type, offsetX, offsetY } = selectedElement;
            
            const width = x2 - x1;
            const height = y2 - y1;
            const newX = clientX - offsetX;
            const newY = clientY - offsetY;
    
            updateElement(id, newX, newY, (newX + width), (newY + height), accentColor, type);
        } 
    }

    function handleResizing(event){
        const{clientX, clientY} = event;
        if(!resizingEnabled) return;

        if(action === 'resizing') {
            if(selectedElement){
                setHoveredElement(null);
                hideConnectionPointsOnElement();
                const { id, type, position, ...coordinates } = selectedElement;
                const {x1, y1, x2, y2} = resizedCoordinates(clientX, clientY, position, coordinates);
                updateElement(id, x1, y1, x2, y2, elementColor, type);
                if(selectedElement.type === 'line'){
                    handleConnectingElements(event);
                }
            } 
        }
    }

    function handleConnectingElements(event){
        const{clientX, clientY} = event;
        const elementsTempCopy = [...elements];
        var elementsWithoutLines = [];
        var index = 0;
        elementsTempCopy.forEach(element => {
            if(element.type !== 'line'){
                elementsWithoutLines[index++] = element;
            }
        });
        const connectableElementOption = getElementAtMousePosition(clientX, clientY, elementsWithoutLines);
        // There is a connectable element at mouse position (mouse position == start/end of line)
        if(connectableElementOption){
            const position = connectableElementOption.position;
            showConnectionPointOnElement(position, connectableElementOption);
            // There is already a connectable element
            if(connectableElement){
                // There is a new option to connect to
                if(connectableElementOption.id !== connectableElement.id){
                    recolorElement(connectableElement, elementColor);
                    setConnectableElement(connectableElementOption);
                } else if(connectableElementOption.strokeColor !== connectColor){
                    // The option to connect to is the same one as already suggested
                    recolorElement(connectableElement, connectColor);
                }
            } else {
                // There was no connectable element yet, but there is one now 
                setConnectableElement(connectableElementOption);
            }
            // recolorElement(connectableElement, connectColor); // highlights element in connectColor
        } else if(connectableElement){
            // There is no connectable element
            recolorElement(connectableElement, elementColor);
            setConnectableElement(null);
            clearConEllipse();
        }
    }
    
    /**
     * Hovering over an element to hightlight it
     */
    function handleHovering(event){ // Hovering over an element to hightlight it
        if(!hoveringEnabled) return;
        if(activeTool === 'selection' && action !== 'moving' && action !== 'resizing') {
            const{clientX, clientY} = event;
            const element = getElementAtMousePosition(clientX, clientY, elements); 
            
            if(element) {
                element.position = setCursorForLine(element.position);
                event.target.style.cursor = element.position;

                if(hoveredElement) {
                    if(element.id !== hoveredElement.id) {
                   
                        unHighlightElement(hoveredElement);
                        setHoveredElement(element);

                    } else {
                        highlightElement(hoveredElement);
                    }
                } 
                else {
                    // recolorElement(element, accentColor);
                    setHoveredElement(element);
                }

            } else if(hoveredElement) { 
                event.target.style.cursor = "default";
                unHighlightElement(hoveredElement);
                setHoveredElement(null);
            }
        }
    }

    function handleMouseDown(event) {
        const{clientX, clientY} = event;
        if(activeTool === 'selection') {
            const element = getElementAtMousePosition(clientX, clientY, elements);
            if(element) {
                const offsetX = clientX - element.x1;
                const offsetY = clientY - element.y1;

                if(selectedElement && element.id === selectedElement.id){
                    // if element which is clicked is same as the selected element... unselect the selected element
                    unSelectElementToEdit(element);
                    setSelectedElement(null);
                } else {
                    // otherwise select the element clicked
                    selectElementToEdit(element);
                    setSelectedElement({...element, offsetX, offsetY});
                }

                
                
                if(element.position === "move"){
                    setAction('moving');
                } else {
                    // console.log("Action set to resizing");
                    setAction('resizing');
                }
                
            }
        } else {
            setAction('drawing');
            const id = elements.length;
            const element = CreateNewElement(id, clientX, clientY, clientX, clientY, accentColor);
            if(element) setElements(prevState => [...prevState, element]);
        }
    }

    function handleMouseMove(event){

        handleDrawing(event);
        handleMoving(event);
        handleHovering(event);
        handleResizing(event);
    }

    function handleMouseUp(event) {
        const index = elements.length - 1;
        
        if(action === 'drawing') {
            const {id, type, strokeColor} = elements[index];
            const {x1, y1, x2, y2} = adjustElementCoordinates(elements[index]);
            updateElement(id, x1, y1, x2, y2, strokeColor, type);
        }

        if(connectionEllipse) { //action == 'resizing' && selectedElement && selectedElement.type === 'line'

            const { id, x1, y1, x2, y2, color, type } = selectedElement;
            const { x, y } = connectionEllipse;
            updateElement(id, x, y, x2, y2, elementColor, type);
            console.log(getClosestToPoint(x ,y, x1, y1, x2, y2));
            // if(getClosestToPoint(x, y, x1, y1, x2, y2) === 0){
                
            // } else {
            //     updateElement(id, x1, y1, x, y, elementColor, type);
            // }
            // console.log("data: " + id + " " + x + " " + y + " " + x2 + " " + y2 + " " + elementColor + " " + type);
            
        }
        setAction('none');
        // setSelectedElement(null);
        clearConEllipse();
    }

    function addElement(element) {
        const index = element.id;
        const elementsCopy = [...elements];
        elementsCopy[index] = element;
        
        setElements(elementsCopy);
    }

    function addConnectionPoints(connectionPoints) {

        // const index = connectionPoint.id;
        // const connectionsPointsCopy = [...connectionPoints];
        // connectionsPointsCopy[index] = connectionPoint;

        // setConnectionPoints(connectionsPointsCopy);

    }

    function clearConnectionPoints() {
        setConnectionPoints([]);
    }

    function clearConEllipse() {
        connectionEllipse = null;
    }

    function drawConnectionPoints(rc) {
        connectionPoints.forEach(connectionPoint => {
            if(connectionPoint && connectionPoint.element) {
                rc.draw(connectionPoint.element);
            }
        });
    }

    return (
        <canvas 
          className="main_canvas"
          id="main_canvas" 
          style={{backgroundColor: '#333333'}} 
          width={window.innerWidth} 
          height={window.innerHeight}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          Canvas
        </canvas>
    );
}

export { CanvasComponent };