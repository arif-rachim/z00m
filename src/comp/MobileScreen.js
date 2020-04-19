import React, {useEffect, useReducer, useRef} from "react";
import classes from './MobileScreen.module.css';
const DEFAULT_STATE = {
    screen : {
        width : 0,
        height : 0
    }
};

const reducer = (state,action) => {
    switch (action.type) {
        case 'screen-size' :
            return {...state,screen:{width:action.width,height:action.height}}
        default :
            return state;
    }
};


function calculateBoxPerRow(numberOfBoxes) {
    const boxesPerRow = {
        '1' : 1,
        '2' : 2,
        '3' : 3,
        '4' : 2,
        '5' : 3,
        '6' : 3,
        '7' : 4,
        '8' : 4,
        '9' : 3,
        '10' : 5,
        '11' : 4,
        '12' : 4,
        '13' : 5,
        '14' : 5,
        '15' : 5,
        '16' : 4,
        '17' : 5,
        '18' : 5
    };
    const key = numberOfBoxes.toString();
    if(key in boxesPerRow){
        return boxesPerRow[key];
    }
    return 5;
}

function fillContentInViewPort(content, viewPort) {
    if(content == null || viewPort == null){
        return;
    }
    const {offsetWidth: viewPortWidth, offsetHeight: viewPortHeight} = viewPort;
    const {videoWidth: contentWidth, videoHeight: contentHeight} = content;
    if(contentWidth === 0 && contentHeight === 0){
        return;
    }
    const scaleX = viewPortWidth / contentWidth;
    const scaleY = viewPortHeight / contentHeight;
    const scale = Math.max(scaleX,scaleY);
    const newContentWidth = contentWidth * scale;
    const newContentHeight = contentHeight * scale;
    const top = (viewPortHeight - newContentHeight)  / 2;
    const left = (viewPortWidth - newContentWidth) / 2;

    content.setAttribute('style', `
        width:${newContentWidth}px;
        height:${newContentHeight}px;
        top:${top}px;
        left:${left}px;
        position:absolute;
        transition:all 300ms ease-in-out;
    `);
}

function VideoElement({isLandscapeMode,boxPerRow,video}) {
    const style = {};
    const viewPortRef = useRef();
    style[isLandscapeMode ? 'width' : 'height'] = `${(100 / boxPerRow).toFixed(0)}%`;
    useEffect(() => {
        video.onplay = () => {
            fillContentInViewPort(video,viewPortRef.current);
        };
        viewPortRef.current.appendChild(video);

    },[video]);
    return <div ref={viewPortRef} className={classes.viewport} style={style}/>;
}

function updateAllViewports() {
    document.querySelectorAll(`.${classes.viewport}`).forEach((div) => {
        fillContentInViewPort(div.firstChild, div);
    });
}

export default function MobileScreen({videos,controllerRef}){
    const [state,dispatch] = useReducer(reducer,DEFAULT_STATE);
    const screenRef = useRef();
    controllerRef.current = {
        updateDisplay : updateAllViewports
    };
    useEffect(() => {
        function onResize(event) {
            const {offsetWidth:width,offsetHeight:height} = screenRef.current;
            dispatch({type:'screen-size',width,height});
        }
        onResize();
        window.addEventListener("resize", onResize);
        window.updateMobileScreenViewPorts = () => {
            updateAllViewports();
        };
        // IOS Bug fix
        document.addEventListener('touchmove', function (event) {
            if (event.scale !== 1) { event.preventDefault(); }
        }, false);
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        return () => {
            window.removeEventListener('resize',onResize);
        }
    },[]);
    const isLandscapeMode = state.screen.width > state.screen.height;
    const screenStyle = {
        height:'100%',
        boxSizing:'border-box',
        position:'relative',
        display : 'flex',
        flexDirection : isLandscapeMode ? 'row' : 'column',
        flexWrap : 'wrap'
    };
    const ratio = state.screen.width / state.screen.height;
    useEffect(() => {
        updateAllViewports();
    },[ratio]);
    const numberOfBoxes = videos.length;
    useEffect(() => {
        updateAllViewports();
    },[numberOfBoxes]);
    const boxPerRow = calculateBoxPerRow(numberOfBoxes);
    return <div ref={screenRef} style={screenStyle}>
        {videos.map((video) => <VideoElement key={video.id} video={video} isLandscapeMode={isLandscapeMode} boxPerRow={boxPerRow}/>)}
    </div>
}
