import * as React from 'react';
import * as ReactDOM from 'react-dom';
import StickyContext from './StickyContext';
import { Properties } from 'csstype';

export type StickyProps = {
  relative?: boolean;
  topOffset?: number;
  bottomOffset?: number;
  disableCompensation?: boolean;
  disableHardwareAcceleration?: boolean;
};

const Sticky: React.FC<StickyProps> = ({
  relative = false,
  topOffset = 0,
  bottomOffset = 0,
  disableCompensation = false,
  disableHardwareAcceleration = false,
  children,
}) => {
  const placeholderRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<any>(null);

  const { getParent, unsubscribe, subscribe } = React.useContext(StickyContext);

  const [stateIsSticky, setIsSticky] = React.useState(false);
  const [stateWasSticky, setWasSticky] = React.useState(false);
  const [stateStyle, setStyle] = React.useState<Properties<string | number>>(
    {}
  );
  const [stateDistanceFromTop, setDistanceFromTop] = React.useState(0);
  const [stateDistanceFromBottom, setDistanceFromBottom] = React.useState(0);
  const [stateCalculatedHeight, setCalculatedHeight] = React.useState(0);

  React.useEffect(() => {
    if (!subscribe || !unsubscribe) {
      throw new TypeError(
        'Expected Sticky to be mounted within StickyContainer'
      );
    }

    subscribe(handleContainerEvent);

    return () => {
      unsubscribe(handleContainerEvent);
    };
  }, []);

  React.useEffect(() => {
    placeholderRef.current!.style.paddingBottom = disableCompensation
      ? `0`
      : `${stateIsSticky ? stateCalculatedHeight : 0}px`;
  });

  type HandleContainerEventType = (props: { [k: string]: any }) => any;

  const handleContainerEvent: HandleContainerEventType = ({
    distanceFromTop,
    distanceFromBottom,
    eventSource,
  }) => {
    const parent = getParent!();

    let preventingStickyStateChanges = false;

    if (relative) {
      preventingStickyStateChanges = eventSource !== parent;
      distanceFromTop =
        -(eventSource.scrollTop + eventSource.offsetTop) +
        placeholderRef.current!.offsetTop;
    }

    const placeholderClientRect = placeholderRef.current!.getBoundingClientRect();
    const contentClientRect = contentRef.current!.getBoundingClientRect();
    const calculatedHeight = contentClientRect.height;

    const bottomDifference =
      distanceFromBottom - bottomOffset - calculatedHeight;
    const wasSticky = stateIsSticky;
    const isSticky = preventingStickyStateChanges
      ? wasSticky
      : distanceFromTop <= -topOffset && distanceFromBottom > -bottomOffset;

    distanceFromBottom =
      (relative ? parent.scrollHeight - parent.scrollTop : distanceFromBottom) -
      calculatedHeight;

    const style: Partial<Properties<string | number>> = !isSticky
      ? {}
      : {
          position: 'fixed',
          top:
            bottomDifference > 0
              ? relative
                ? parent.offsetTop - parent.offsetParent.scrollTop
                : 0
              : bottomDifference,
          left: placeholderClientRect.left,
          width: placeholderClientRect.width,
        };

    if (!disableHardwareAcceleration) {
      style.transform = 'translateZ(0)';
    }

    setIsSticky(isSticky);
    setWasSticky(wasSticky);
    setDistanceFromBottom(distanceFromBottom);
    setDistanceFromTop(distanceFromTop);
    setCalculatedHeight(calculatedHeight);
    setStyle(style);
  };

  if (!children) {
    console.error('Sticky expect to have a function as children');

    return null;
  }

  const element = React.cloneElement(
    // @ts-ignore
    children({
      isSticky: stateIsSticky,
      wasSticky: stateWasSticky,
      distanceFromTop: stateDistanceFromTop,
      distanceFromBottom: stateDistanceFromBottom,
      calculatedHeight: stateCalculatedHeight,
      style: stateStyle,
    }),
    {
      ref: (content: any) => {
        contentRef.current = ReactDOM.findDOMNode(content) as Element;
      },
    }
  );

  return (
    <div>
      <div ref={placeholderRef} />
      {element}
    </div>
  );
};

export default Sticky;
