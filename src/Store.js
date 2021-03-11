import React, { useState } from 'react';

const initialstate = "selection";

export const Context = React.createContext();

const Store = ({ children }) => {
    const [activeTool, setActiveTool] = useState(initialstate);

    return (
    <Context.Provider value={[activeTool, setActiveTool]}>{children}</Context.Provider>
    );
};

export default Store;