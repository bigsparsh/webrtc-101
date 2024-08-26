import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Room from "./Room";

const Lobby = () => {
  const [localVideoTrack, setLocalVideoTrack] =
    useState<MediaStreamTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<MediaStreamTrack | null>(null);
  const [joined, setJoined] = useState<boolean>(false);
  const [id, setId] = useState<string>();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setId(uuidv4());
    if (videoRef && videoRef.current) {
      getCam();
    }
  }, [videoRef]);

  const getCam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setLocalAudioTrack(stream.getAudioTracks()[0]);
    setLocalVideoTrack(stream.getVideoTracks()[0]);
    if (!videoRef.current) {
      return;
    }
    videoRef.current.srcObject = new MediaStream([stream.getVideoTracks()[0]]);
    videoRef.current.play();
  };

  const commence = () => {
    setJoined(true);
  };

  if (!joined) {
    return (
      <div>
        <h1>Welcome to omegle</h1>
        <video autoPlay ref={videoRef}></video>
        <p>Your ID is: {id}</p>
        <button onClick={commence}>Press to start connecting</button>
      </div>
    );
  }
  return (
    <Room
      id={id}
      localAudioTrack={localAudioTrack}
      localVideoTrack={localVideoTrack}
    />
  );
};
export default Lobby;
