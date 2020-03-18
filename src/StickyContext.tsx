import * as React from 'react';

export type StickyContextType = {
  subscribe: Function | null;
  unsubscribe: Function | null;
  getParent: Function | null;
};

const StickyContext = React.createContext<StickyContextType>({
  subscribe: null,
  unsubscribe: null,
  getParent: null,
});

export default StickyContext;
