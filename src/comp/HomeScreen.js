/**
 * HomeScreen is a component used to render video playback from users who log into a room.
 * HomeScreen will be mounted by react if the user has successfully logged in.
 */
import React, {useContext, useEffect} from 'react';
import {AppContext} from "../AppContext";
import ExitToAppOutlinedIcon from '@material-ui/icons/ExitToAppOutlined';
import Button from "@material-ui/core/Button";
import CircularProgress from '@material-ui/core/CircularProgress';

export default function HomeScreen(){
    const {state,videoRef,startVideo,leaveRoom} = useContext(AppContext);

    useEffect(() => {
        if(!state.token){
            return;
        }
        if(!state.activeRoom){
            startVideo();
        }
    },[state,startVideo]);

    return  <div style={{position:'relative',overflow:'auto',width:'100%'}}>
            <div ref={videoRef}  style={{display:'flex',flexWrap:"wrap",justifyContent:'center',padding:'1rem'}}/>
            {state.activeRoom &&
            <Button
                variant="outlined"
                style={{position:'absolute',top:10,right:10,color:'#FBCF14',backgroundColor:'rgba(0,0,0,0.3)'}}
                startIcon={<ExitToAppOutlinedIcon />} onClick={() => leaveRoom()}>
                Leave Room
            </Button>
            }
            {!state.activeRoom &&
                <div style={{textAlign:'center'}}>
                    <CircularProgress size={'3rem'} style={{color:'#FBCF14'}} />
                </div>
            }
        </div>
}
