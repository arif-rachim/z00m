import React from 'react';
import LoginScreen from "./comp/LoginScreen";
import AppContextProvider from "./AppContext";
import HomeScreen from "./comp/HomeScreen";

/**
 * App is the main component that becomes the root of this application.
 * The App component has an AppContextProvider which will render the HomeScreen or LoginScreen component.
 * @returns {*}
 * @constructor
 */
function App() {
    return (
        <AppContextProvider>
            {(state) => (
            <div className="App">
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center',justifyContent:'center',height:'100%'}}>
                    {state.userLoggedIn ? <HomeScreen /> : <LoginScreen/>}
                </div>
            </div>)}
        </AppContextProvider>
    );
}

export default App;
