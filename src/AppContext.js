import React, {useReducer} from "react";

export const AppContext = React.createContext({});

/**
 * Reducer contains the logic of this application. Reducer accepts two parameters.
 * The first parameter is state, and the second is action.
 * The state is the n-1 state object, while the action is the event triggered by the producer.
 * @param state
 * @param action
 */
function reducer(state,action){
    const newState = {...state};
    switch(action.type){
        case 'login' : {
            newState.userLoggedIn = true;
        }
    }
    return newState;
}

/**
 * AppContextProvider contains an object that will be rendered as a React component.
 * AppContextProvider will delegate under its context value.
 * The context value of AppContextProvider is currently the state and dispatch function.
 */
export default function AppContextProvider({children}){
    const [state,dispatch] = useReducer(reducer,{});

    return <AppContext.Provider value={{state,dispatch}}>
        {children(state)}
    </AppContext.Provider>
}
