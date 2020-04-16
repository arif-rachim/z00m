/**
 * HomeScreen is a component used to render video playback from users who log into a room.
 * HomeScreen will be mounted by react if the user has successfully logged in.
 */
import React, {useEffect, useRef} from 'react';
export default function HomeScreen(){
    const videoRef = useRef();
    useEffect(() => {
        (async () => {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: true
            });
            videoRef.current.srcObject = stream;
        })();
    },[]);
    return <div>
        <div style={{position:'relative',transition:'all 300ms linear-in-out'}}>
            <video ref={videoRef} style={{borderRadius:'1rem',border:'5px solid #FBCF14',boxShadow:'0px 5px 10px 5px rgba(0,0,0,1)',overflow:'hidden'}} autoPlay={true} playsInline={true} />
        </div>
    </div>
}
