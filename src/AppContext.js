import React, {useReducer} from "react";
import * as axios from "axios";
import {connect, createLocalTracks} from 'twilio-video';

export const AppContext = React.createContext({});

const TOKEN = 'aHR0cHM6Ly9kZXNlcnQtY2hpaHVhaHVhLTIxNjMudHdpbC5pby9jcmVhdGUtejAwbS10b2tlbg==';

const DEFAULT_STATE = {
    identity: false,
    room: false,
    token: false,
    activeRoom: false,
    videos: []
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
                videos: [...state.videos, action.video]
            };
        case 'disconnect':{
            state.activeRoom && state.activeRoom.disconnect();
            return DEFAULT_STATE;
        }
        case 'video-add' :
            return {
                ...state,
                videos: [...state.videos, action.video]
            };
        case 'video-remove' : {
            return {
                ...state,
                videos : state.videos.filter(v => v.id !== action.id)
            }
        }
        default :
            return state;
    }
}


/**
 * AppContextProvider contains an object that will be rendered as a React component.
 * AppContextProvider will delegate under its context value.
 * The context value of AppContextProvider is currently the state and dispatch function.
 */
export default function AppContextProvider({children}) {
    const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);

    async function getRoomToken({identity, room}) {

        const result = await axios.post(atob(TOKEN), {
            identity,
            room: room
        });

        dispatch({type: 'join', token: result.data, identity, room});
    }

    function handleRemoteParticipant(participant) {
        const id = participant.sid;
        const addTrack = track => {
            if(track.kind === 'video'){
                const el = track.attach();
                el.id = id;
                el.setAttribute('data-identity',participant.identity);
                dispatch({type:'video-add',video:el})
            }
            if(track.kind === 'audio'){
                const elAudio = track.attach();
                elAudio.setAttribute('data-id',id);
                elAudio.setAttribute('style','position:absolute;top:0px;left:0px');
                document.body.appendChild(elAudio);
            }
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
            dispatch({type:'video-remove',id:id});
        });
    }


    async function connectToRoom() {
        if (!state.token) {
            return;
        }

        const tracks = await createLocalTracks({
            audio: true,
            video: {facingMode: 'user'}
        });

        const localTrack = tracks.find(track => track.kind === 'video');
        const activeRoom = await connect(state.token, {
            name: state.room,
            tracks
        }).catch(error => {
            console.error('Unable to join room', error.message);
        });


        activeRoom.participants.forEach(handleRemoteParticipant);
        activeRoom.on('participantConnected', handleRemoteParticipant);

        // Listen to the "beforeunload" event on window to leave the Room
        // when the tab/browser is being closed.
        window.addEventListener('beforeunload', () => activeRoom.disconnect());

        // iOS Safari does not emit the "beforeunload" event on window.
        // Use "pagehide" instead.
        window.addEventListener('pagehide', () => activeRoom.disconnect());
        const video = localTrack.attach();
        video.id = 'my-self';
        dispatch({type: 'set-active-room', activeRoom,video});

    }

    const startVideo = () => connectToRoom();
    const leaveRoom = () => {
        dispatch({type: 'disconnect'});
        setTimeout(() => window.location.reload(true),1000);

    };

    return <AppContext.Provider value={{state, getRoomToken, startVideo, leaveRoom}}>
        <div style={{position: 'relative', width: '100%', height: '100%'}}>
            {children(state)}
        </div>
    </AppContext.Provider>
}
