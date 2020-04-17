import React, {useReducer, useRef} from "react";
import * as axios from "axios";
import {connect,createLocalVideoTrack } from 'twilio-video';

export const AppContext = React.createContext({});

const TOKEN = 'aHR0cHM6Ly9kZXNlcnQtY2hpaHVhaHVhLTIxNjMudHdpbC5pby9jcmVhdGUtejAwbS10b2tlbg==';
const participantBoxSize = 200;
const DEFAULT_STATE = {
    identity: false,
    room: false,
    token: false,
    activeRoom: false,
};
/**
 * Reducer contains the logic of this application. Reducer accepts two parameters.
 * The first parameter is state, and the second is action.
 * The state is the n-1 state object, while the action is the event triggered by the producer.
 * @param state
 * @param action
 */
function reducer(state,action){
    switch(action.type){
        case 'join' :
            return {
                ...state,
                token: action.token,
                room: action.room,
                identity: action.identity,
            };
        case 'set-active-room' :
            return {
                ...state,
                activeRoom: action.activeRoom,
            };
        case 'disconnect':
            state.activeRoom && state.activeRoom.disconnect();
            return DEFAULT_STATE;
    }
    return state;
}

function createParticipantDiv() {
    const participantDiv = document.createElement('div');
    participantDiv.className = 'participant';
    participantDiv.setAttribute('style', `width : ${participantBoxSize}px; height: ${participantBoxSize}px`);

    return participantDiv;
}

function uploadElPosition(el) {
    setTimeout(() => {
        const {videoWidth, videoHeight} = el;
        const minVal = Math.min(videoWidth, videoHeight);
        let scale = 1;
        if (minVal > participantBoxSize) {
            scale = participantBoxSize / minVal;
        }
        const top = ((participantBoxSize - (videoHeight)) / 2).toFixed(0);
        const left = ((participantBoxSize - (videoWidth)) / 2).toFixed(0);
        el.setAttribute('style', `top : ${top}px; left : ${left}px; transform : scale(${scale.toFixed(2)})`);
    }, 200);
}

/**
 * AppContextProvider contains an object that will be rendered as a React component.
 * AppContextProvider will delegate under its context value.
 * The context value of AppContextProvider is currently the state and dispatch function.
 */
export default function AppContextProvider({children}){
    const [state,dispatch] = useReducer(reducer,DEFAULT_STATE);
    const videoRef = useRef();
    async function getRoomToken({identity,room}){

        const result = await axios.post(atob(TOKEN),{
            identity,
            room : room
        });

        dispatch({type:'join',token:result.data,identity,room});
    }

    function handleRemoteParticipant(container){
        return (participant) => {
            const id = participant.sid;
            const el = createParticipantDiv();
            const name = document.createElement('h4');
            name.innerText = participant.identity;
            el.appendChild(name);
            container.appendChild(el);
            const addTrack = track => {
                const participantDiv = document.getElementById(id);
                const media = track.attach();
                media.className = 'video';
                participantDiv.appendChild(media);
            };
            participant.tracks.forEach(publication => {
                if(publication.isSubscribed){
                    addTrack(publication.track);
                }
            });

            // If new tracks get added later, add those, too.
            participant.on('trackSubscribed', addTrack);

            // When tracks are no longer available, remove the elements displaying them.
            participant.on('trackUnsubscribed', track => {
                // Get a list of elements from detach and remove them from the DOM.
                track.detach().forEach(el => el.remove());
                const container = document.getElementById(id);
                if (container){
                    container.remove();
                }
            });
        }
    }

    async function connectToRoom(){
        if(!state.token){
            return;
        }
        const activeRoom = await connect(state.token,{
            name : state.room,
            audio : true,
            video : { width : 320,height:320 },
            logLevel : 'info'
        }).catch(error => {
            console.error('Unable to join room',error.message);
        });

        const localTrack = await createLocalVideoTrack().catch(error => {
            console.error(`Unable to create local tracks: ${error.message}`);
        });

        if(!videoRef.current.hasChildNodes()){
            const localEl = localTrack.attach();
            localEl.className = 'video';
            const participantDiv = createParticipantDiv();
            participantDiv.appendChild(localEl);
            videoRef.current.appendChild(participantDiv);
            uploadElPosition(localEl);
        }

        const handleParticipant = handleRemoteParticipant(videoRef.current);
        activeRoom.participants.forEach(handleParticipant);
        activeRoom.on('participantConnected',handleParticipant);
        dispatch({type:'set-active-room',activeRoom});
    }
    const startVideo = () => connectToRoom();
    const leaveRoom = () => dispatch({ type: 'disconnect' });

    return <AppContext.Provider value={{state,getRoomToken,videoRef,startVideo,leaveRoom}}>
        <div style={{position:'relative',width:'100%',height:'100%'}}>
            {children(state)}
        </div>
    </AppContext.Provider>
}
