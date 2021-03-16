import React, { useLayoutEffect, useState, useContext } from 'react';
import rough from 'roughjs/bundled/rough.esm';
import { Context } from '../Store';
const generator = rough.generator();

// Feature toggles
const drawingEnabled = true;
const movingEnabled = true;
const hoveringEnabled = true;

// Application properties
const accentColor = "#FF5A5A";
const elementColor = 'white';

function CanvasComponent(props) {
    const [elements, setElements] = useState([]);
    const [action, setAction] = useState('none');  
    const [activeTool, setActiveTool] = useContext(Context);
    const [selectedElement, setSelectedElement] = useState(null);
    const [hoveredElement, setHoveredElement] = useState(null);

    useLayoutEffect(() => {
        const canvas = document.getElementById('main_canvas');
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

        const roughCanvas = rough.canvas(canvas);
        
        elements.forEach(({roughElement}) => roughCanvas.draw(roughElement));
    }, [elements]);

    function CreateNewElement(id, x1, y1, x2, y2, strokeColor, type){
        if(!type) type = activeTool;
        var roughElement;
        switch(type) {
        case 'rectangle':
            roughElement = generator.rectangle(x1,y1,x2-x1,y2-y1, {stroke: strokeColor});
            break;
        case 'line':
            roughElement = generator.line(x1,y1,x2,y2, {stroke: strokeColor});
            break;
        case 'selection':
            return null;
            break;
        default:
            break;
        }
        
        return {id, x1, y1, x2, y2, type, roughElement};
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

                // Check for each line of rectangle if mouse is on it
                if(isPosOnLine(pos, nw, ne)) return true;
                if(isPosOnLine(pos, ne, se)) return true;
                if(isPosOnLine(pos, se, sw)) return true;
                if(isPosOnLine(pos, sw, nw)) return true;

                // Check if mouse is within rectangle
                // const minX = Math.min(x1, x2);
                // const minY = Math.min(y1, y2);
                // const maxX = Math.max(x1, x2);
                // const maxY = Math.max(y1, y2);
                // return mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY;
            case "line":
                const a = { x: x1, y: y1 };
                const b = { x: x2, y: y2 };
                const c = { x: mouseX, y: mouseY };

                return isPosOnLine(c, a, b);
            default:
                console.log("no type");
                break;
        }      
    }

    function isPosOnLine(pos, startLine, endLine){
        const offset = distance(startLine, endLine) - (distance(startLine, pos) + distance(endLine, pos));
        const onLine = Math.abs(offset) < 1;
        return onLine;
    }

    function getElementAtMousePosition (mouseX, mouseY, elements) {
        return elements.find(element => isWithinElement(mouseX, mouseY, element));
    }

    function updateElement(id, x1, y1, x2, y2, color, type) {
        const updatedElement = CreateNewElement(id, x1, y1, x2, y2, color, type);
        
        if(updatedElement) addElement(updatedElement);
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
        if(!movingEnabled) return;
        if(action === 'moving') {
            setHoveredElement(null);
            const{clientX, clientY} = event;
            const { id, x1, x2, y1, y2, type, offsetX, offsetY } = selectedElement;
            
            const width = x2 - x1;
            const height = y2 - y1;
            const newX = clientX - offsetX;
            const newY = clientY - offsetY;
    
            updateElement(id, newX, newY, (newX + width), (newY + height), accentColor, type);
        }
    }
    
    function handleHovering(event){ // Hovering over an element to hightlight it
        if(!hoveringEnabled) return;
        if(activeTool === 'selection' && action !== 'moving') {
            const{clientX, clientY} = event;
            console.log("Hovering mouse: " + action);
            const element = getElementAtMousePosition(clientX, clientY, elements);
            if(element) {
                event.target.style.cursor = "move";
                if(hoveredElement) {
                    if(element.id !== hoveredElement.id) {
                   
                        recolorElement(hoveredElement, elementColor);
                        setHoveredElement(element);

                    } else {
                        recolorElement(hoveredElement, accentColor);
                    }
                } 
                else {
                    // recolorElement(element, accentColor);
                    setHoveredElement(element);
                }

            } else if(hoveredElement) { 
                event.target.style.cursor = "default";
                recolorElement(hoveredElement, elementColor);
                setHoveredElement(null);
            }
        }
    }

    const handleMouseDown = (event) => {
        const{clientX, clientY} = event;
        if(activeTool === 'selection') {
            const element = getElementAtMousePosition(clientX, clientY, elements);
            if(element) {
                const offsetX = clientX - element.x1;
                const offsetY = clientY - element.y1;
                setSelectedElement({...element, offsetX, offsetY});
                setAction('moving');
            }
        } else {
            setAction('drawing');
            const id = elements.length;
            const element = CreateNewElement(id, clientX, clientY, clientX, clientY, accentColor);
            if(element) setElements(prevState => [...prevState, element]);
        }
    };

    const handleMouseMove = (event) => {

        handleDrawing(event);
        handleMoving(event);
        handleHovering(event);
    };

    const handleMouseUp = (event) => {
        setAction('none');
        setSelectedElement(null);
    };

    const addElement = (element) => {
        const index = element.id;
        const elementsCopy = [...elements];
        elementsCopy[index] = element;
        
        setElements(elementsCopy);
    };

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