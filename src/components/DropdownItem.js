import React, { useContext } from 'react';
import { Context } from '../Store';

function DropdownItem(props) {
    const [activeElement, setActiveElement] = useContext(Context);

    function changeActiveElement(props){
        activeElement===props.name ? setActiveElement("") : setActiveElement(props.name);
    }

    return (
    <a href="#" className="menu-item">
        <span onClick={()=>changeActiveElement(props)}
        className="dropdown-icon-button">{activeElement===props.name ? props.iconActive : props.icon }</span>
    </a>
    );
}

export { DropdownItem };