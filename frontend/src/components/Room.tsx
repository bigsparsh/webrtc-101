import { useEffect, useRef, useState } from "react";

const Room = ({
  id,
  localVideoTrack,
  localAudioTrack,
}: {
  id: string | undefined;
  localVideoTrack: MediaStreamTrack | null;
  localAudioTrack: MediaStreamTrack | null;
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // @ts-expect-error nothing
  const [remoteVideoTrack, setRemoteVideoTrack] =
    useState<MediaStreamTrack | null>(null);
  // @ts-expect-error nothing
  const [remoteAudioTrack, setRemoteAudioTrack] =
    useState<MediaStreamTrack | null>(null);
  const [lobby, setLobby] = useState<boolean>(true);
  // @ts-expect-error nothing
  const [receivingPc, setReceivingPc] = useState<RTCPeerConnection | null>(
    null,
  );
  // @ts-expect-error nothing
  const [sendingPc, setSendingPc] = useState<RTCPeerConnection | null>(null);

  useEffect(() => {
    const ws = new WebSocket("wss://webrtc-101.onrender.com");
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "connect", user_id: id }));
    };
    ws.onmessage = async (data) => {
      const message = JSON.parse(data.data);

      if (message.type === "send-offer") {
        const pc = new RTCPeerConnection({
          iceServers: [
            {
              urls: [
                "stun:stun.l.google.com:19302",
                "stun:global.stun.twilio.com:3478",
                "turn:openrelay.metered.ca:80",
              ],
              username: "openrelayproject",
              credential: "openrelayproject",
            },
          ],
        });
        setLobby(false);
        setSendingPc(pc);

        if (localVideoTrack) {
          pc.addTrack(localVideoTrack);
        }
        if (localAudioTrack) {
          pc.addTrack(localAudioTrack);
        }

        pc.onnegotiationneeded = async () => {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(
            JSON.stringify({
              type: "createOffer",
              offer,
              roomId: message.roomId,
            }),
          );
        };
        pc.onicecandidate = (e) => {
          if (e.candidate) {
            ws.send(
              JSON.stringify({
                type: "iceCandidate",
                candidate: e.candidate,
                roomId: message.roomId,
              }),
            );
          }
        };
      } else if (message.type === "createOffer") {
        const pc = new RTCPeerConnection({
          iceServers: [
            {
              urls: [
                "stun:stun.l.google.com:19302",
                "stun:global.stun.twilio.com:3478",
              ],
            },
          ],
        });
        setLobby(false);
        setReceivingPc(pc);

        await pc.setRemoteDescription(message.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        const stream = new MediaStream();
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }

        // pc.ontrack = (e) => {
        //   const { track, type } = e;
        //   if (type === "video") {
        //     remoteVideoRef.current?.srcObject.addTrack(track);
        //   } else if (type === "audio") {
        //     remoteVideoRef.current?.srcObject.addTrack(track);
        //   }
        //   remoteVideoRef.current?.play();
        // };

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            ws.send(
              JSON.stringify({
                type: "iceCandidate",
                person: "receiver",
                candidate: e.candidate,
                roomId: message.roomId,
              }),
            );
          }
        };

        console.log("sending answer");
        ws.send(
          JSON.stringify({
            type: "createAnswer",
            answer,
            roomId: message.roomId,
          }),
        );

        setTimeout(() => {
          const track1 = pc.getTransceivers()[0].receiver.track;
          const track2 = pc.getTransceivers()[1].receiver.track;
          console.log(track1);
          if (track1.kind === "video") {
            setRemoteVideoTrack(track2);
            setRemoteVideoTrack(track1);
          } else {
            setRemoteAudioTrack(track1);
            setRemoteVideoTrack(track2);
          }
          //@ts-ignore
          remoteVideoRef.current.srcObject.addTrack(track1);
          //@ts-ignore
          remoteVideoRef.current.srcObject.addTrack(track2);
          //@ts-ignore
          remoteVideoRef.current.play();
          // if (type == 'audio') {
          //     // setRemoteAudioTrack(track);
          //     // @ts-ignore
          //     remoteVideoRef.current.srcObject.addTrack(track)
          // } else {
          //     // setRemoteVideoTrack(track);
          //     // @ts-ignore
          //     remoteVideoRef.current.srcObject.addTrack(track)
          // }
          // //@ts-ignore
        }, 5000);
      } else if (message.type === "createAnswer") {
        setLobby(false);
        setSendingPc((p) => {
          p?.setRemoteDescription(message.answer);
          return p;
        });
      } else if (message.type === "lobby") {
        setLobby(true);
      } else if (message.type === "iceCandidate") {
        if (message.person === "sender") {
          setReceivingPc((p) => {
            p?.addIceCandidate(message.candidate);
            return p;
          });
        } else if (message.person === "receiver") {
          setSendingPc((p) => {
            p?.addIceCandidate(message.candidate);
            return p;
          });
        }
      }
    };
  }, [id]);

  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      const stream = new MediaStream([localVideoTrack]);
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play();
    }
  }, [localVideoTrack]);

  return (
    <div>
      <h1>You are : {id}</h1>
      <video autoPlay ref={localVideoRef} width="400" height="300" />
      <video autoPlay ref={remoteVideoRef} width="400" height="300" />
      {lobby ? <h3>Waiting for someone to connect.....</h3> : <p>Connected</p>}
    </div>
  );
};
export default Room;
