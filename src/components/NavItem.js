import React, { useState } from 'react';

function NavItem(props) {
    const [toolBarOpen, setToolBarOpen] = useState(false);
    const [open, setOpen] = useState(false);

    function toggleToolBarOpen() {
        setToolBarOpen(!toolBarOpen);
    }

    return (
        <li className="nav-item">
        <a href="#" className="menu-icon-button" onClick={() => setOpen(!open)}>
            { open ? props.openIcon : props.closedIcon}
        </a>
        {open && props.children}
        </li>
    );
};

export { NavItem };