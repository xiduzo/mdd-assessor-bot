import { createContext, PropsWithChildren } from "react";

const FeedbackContext = createContext({});

export function FeedbackProvider(props: PropsWithChildren) {
  return (
    <FeedbackContext.Provider value={{}}>
      {props.children}
    </FeedbackContext.Provider>
  );
}
