import React, { useLayoutEffect, useState, useContext } from 'react';
import rough from 'roughjs/bundled/rough.esm';
import { ReactComponent as DeleteIcon } from './icons/delete.svg';
import { ReactComponent as PlusIcon } from './icons/plusBlack.svg';
import { ReactComponent as PlusIconActive } from './icons/plusActive.svg';
import { ReactComponent as CogIcon } from './icons/cog.svg';
import { ReactComponent as DownChevronIcon } from './icons/down-chevron.svg';
import { ReactComponent as RightChevronIcon } from './icons/right-chevron.svg';
import { ReactComponent as ChevronIcon } from './icons/chevron.svg';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import { ReactComponent as SquareIcon } from './icons/square.svg';
import { ReactComponent as SquareIconActive } from './icons/untitled.svg';
import { ReactComponent as LineIcon } from './icons/line.svg';
import { ReactComponent as LineIconActive } from './icons/line-active.svg';
import { ReactComponent as SelectorIcon } from './icons/selector.svg';
import { ReactComponent as SelectorIconActive } from './icons/selector-active.svg';

import { DropdownMenu } from './components/DropdownMenu';
import { Navbar } from './components/Navbar';
import { NavItem } from './components/NavItem';
import { DropdownItem } from './components/DropdownItem';
import { CanvasComponent } from './components/CanvasComponent';

import Store, { Context } from './Store';

// import { GlobalState, useGlobalState } from './hooks/GlobalState'
// import { store, useGlobalState } from 'state-pool';


// let globalElementState = new GlobalState("square");

const App = () => {

  return (
    <>
      <div style={{backgroundColor: '#333333'}}>
        <Store>
          <div style={{ position: "fixed" }}>
            <Navbar>
              <NavItem closedIcon={<RightChevronIcon/>} openIcon={<DownChevronIcon />}>

                <DropdownMenu>
                  <DropdownItem 
                    name="selection"
                    iconActive={<SelectorIconActive />}
                    icon={<SelectorIcon />}>
                  </DropdownItem>
                  <DropdownItem 
                    name="rectangle"
                    iconActive={<SquareIconActive />}
                    icon={<SquareIcon />}>
                  </DropdownItem>
                  <DropdownItem
                    name="line"
                    iconActive={<LineIconActive />}
                    icon={<LineIcon />}>
                  </DropdownItem>
                  <DropdownItem
                    name="add"
                    iconActive={<PlusIcon />}
                    icon={<PlusIcon />}>
                  </DropdownItem>
                  <DropdownItem
                    name="clear"
                    iconActive={<DeleteIcon />}
                    icon={<DeleteIcon />}>
                  </DropdownItem>
                  <DropdownItem
                    name="toggleItemNumbers"
                    iconActive={<CogIcon />}
                    icon={<CogIcon />}>
                  </DropdownItem>
                </DropdownMenu>

              </NavItem>
            </Navbar>
          </div>
        <CanvasComponent />
        </Store>
      </div>
    </>
  );
};

// dropdown menu was here





export default App;


