import * as React from "react";
import StickyContext from "./StickyContext";
import raf from "raf";

const EVENTS = [
  "resize",
  "scroll",
  "touchstart",
  "touchmove",
  "touchend",
  "pageshow",
  "load"
];

const StickyContainer: React.FC = props => {
  const ref = React.useRef<HTMLDivElement>(null);
  const subscribers = React.useRef<any[]>([]);
  const framePending = React.useRef<boolean>(false);
  const rafHandle = React.useRef<number | null>(null);

  const subscribe = (handler: any) => {
    subscribers.current = [...subscribers.current, handler];
  };

  const unsubscribe = (handler: any) => {
    subscribers.current = subscribers.current.filter(
      current => current !== handler
    );
  };

  const notifySubscribers = (evt: any) => {
    if (!framePending.current) {
      const { currentTarget } = evt;

      rafHandle.current = raf(() => {
        framePending.current = false;
        const {
          top,
          bottom
        } = (ref.current as HTMLDivElement).getBoundingClientRect();

        subscribers.current.forEach(handler =>
          handler({
            distanceFromTop: top,
            distanceFromBottom: bottom,
            eventSource: currentTarget === window ? document.body : ref.current
          })
        );
      });

      framePending.current = true;
    }
  };

  const getParent = () => ref.current;

  React.useEffect(() => {
    EVENTS.forEach(event => {
      console.log("attaching event", event);
      window.addEventListener(event, notifySubscribers);
    });

    return () => {
      if (rafHandle.current) {
        raf.cancel(rafHandle.current);
        rafHandle.current = null;
      }

      EVENTS.forEach(event => {
        console.log("removing event", event);
        window.removeEventListener(event, notifySubscribers);
      });
    };
  }, []);

  return (
    <StickyContext.Provider
      value={{
        subscribe,
        unsubscribe,
        getParent
      }}
    >
      <div
        ref={ref}
        onScroll={notifySubscribers}
        onTouchStart={notifySubscribers}
        onTouchMove={notifySubscribers}
        onTouchEnd={notifySubscribers}
      >
        {props.children}
      </div>
    </StickyContext.Provider>
  );
};

export default StickyContainer;
