import { CSSTransition } from 'react-transition-group';
import { ReactComponent as SquareIcon } from '../icons/square.svg';
import { ReactComponent as SquareIconActive } from '../icons/square-active.svg';
import { ReactComponent as LineIcon } from '../icons/line.svg';
import { ReactComponent as LineIconActive } from '../icons/line-active.svg';
import { DropdownItem } from './DropdownItem';

function DropdownMenu(props) {
    
    return (
      <CSSTransition
        appear={true}
        timeout={500}
        classNames="fade">
        <div className="dropdown">
            <div className="menu">
                { props.children }
            </div>
        </div>
      </CSSTransition>
    );
  };

  export { DropdownMenu };