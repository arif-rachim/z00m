import React, {useReducer, useRef} from "react";
import * as axios from "axios";
import {connect,createLocalTracks} from 'twilio-video';

export const AppContext = React.createContext({});

const TOKEN = 'aHR0cHM6Ly9kZXNlcnQtY2hpaHVhaHVhLTIxNjMudHdpbC5pby9jcmVhdGUtejAwbS10b2tlbg==';
const participantBoxSize = 320;
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
function reducer(state, action) {
    switch (action.type) {
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
    el.addEventListener('resize', () => {
        const {videoWidth, videoHeight} = el;
        const minVal = Math.min(videoWidth, videoHeight);
        const scale = participantBoxSize / minVal;
        const top = ((participantBoxSize - (videoHeight)) / 2).toFixed(0);
        const left = ((participantBoxSize - (videoWidth)) / 2).toFixed(0);
        el.setAttribute('style', `top : ${top}px; left : ${left}px; transform : scale(${scale.toFixed(2)})`);
    });
}

/**
 * AppContextProvider contains an object that will be rendered as a React component.
 * AppContextProvider will delegate under its context value.
 * The context value of AppContextProvider is currently the state and dispatch function.
 */
export default function AppContextProvider({children}) {
    const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
    const videoRef = useRef();

    async function getRoomToken({identity, room}) {

        const result = await axios.post(atob(TOKEN), {
            identity,
            room: room
        });

        dispatch({type: 'join', token: result.data, identity, room});
    }

    function handleRemoteParticipant(container) {
        return (participant) => {
            const id = participant.sid;
            const participantDiv = createParticipantDiv();
            participantDiv.id = id;
            const name = document.createElement('h4');
            name.innerText = participant.identity;
            participantDiv.appendChild(name);
            container.appendChild(participantDiv);
            const addTrack = track => {
                const el = track.attach();
                el.className = 'video';
                el.setAttribute('style','width : 100%; height: 100%');
                participantDiv.appendChild(el);
                uploadElPosition(el);
            };
            participant.tracks.forEach(publication => {
                if (publication.isSubscribed) {
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
                if (container) {
                    container.remove();
                }
            });
        }
    }

    async function connectToRoom() {
        if (!state.token) {
            return;
        }

        const tracks = await createLocalTracks({
            audio: true,
            video: { facingMode: 'user' }
        });

        const localTrack = tracks.find(track => track.kind === 'video');

        const activeRoom = await connect(state.token, {
            name: state.room,
            tracks
        }).catch(error => {
            console.error('Unable to join room', error.message);
        });

        if (!videoRef.current.hasChildNodes()) {
            const localEl = localTrack.attach();
            localEl.className = 'video';
            const participantDiv = createParticipantDiv();
            participantDiv.appendChild(localEl);
            videoRef.current.appendChild(participantDiv);
            uploadElPosition(localEl);
        }

        const handleParticipant = handleRemoteParticipant(videoRef.current);
        activeRoom.participants.forEach(handleParticipant);
        activeRoom.on('participantConnected', handleParticipant);

        // Listen to the "beforeunload" event on window to leave the Room
        // when the tab/browser is being closed.
        window.addEventListener('beforeunload', () => activeRoom.disconnect());

        // iOS Safari does not emit the "beforeunload" event on window.
        // Use "pagehide" instead.
        window.addEventListener('pagehide', () => activeRoom.disconnect());


        dispatch({type: 'set-active-room', activeRoom});
    }

    const startVideo = () => connectToRoom();
    const leaveRoom = () => dispatch({type: 'disconnect'});

    return <AppContext.Provider value={{state, getRoomToken, videoRef, startVideo, leaveRoom}}>
        <div style={{position: 'relative', width: '100%', height: '100%'}}>
            {children(state)}
        </div>
    </AppContext.Provider>
}
