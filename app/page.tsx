"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  LiveKitRoom,
  useVoiceAssistant,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  AgentState,
  DisconnectButton,
} from "@livekit/components-react";
import { useCallback, useEffect, useState } from "react";
import { MediaDeviceFailure } from "livekit-client";
import type { ConnectionDetails } from "./api/connection-details/route";
import { NoAgentNotification } from "@/components/NoAgentNotification";
import { CloseIcon } from "@/components/CloseIcon";
import { useKrispNoiseFilter } from "@livekit/components-react/krisp";
import Visualizer from "@/components/Visualizer";
import Link from "next/link";

export default function Page() {
  const [connectionDetails, updateConnectionDetails] = useState<
    ConnectionDetails | undefined
  >(undefined);
  const [agentState, setAgentState] = useState<AgentState>("disconnected");

  const onConnectButtonClicked = useCallback(async () => {
    // Generate room connection details, including:
    //   - A random Room name
    //   - A random Participant name
    //   - An Access Token to permit the participant to join the room
    //   - The URL of the LiveKit server to connect to
    //
    // In real-world application, you would likely allow the user to specify their
    // own participant name, and possibly to choose from existing rooms to join.

    const url = new URL(
      process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ??
        "/api/connection-details",
      window.location.origin
    );
    const response = await fetch(url.toString());
    const connectionDetailsData = await response.json();
    updateConnectionDetails(connectionDetailsData);
  }, []);

  const [audioTrack, setAudioTrack] = useState<HTMLAudioElement | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const startAudio = () => {
    const audioElement = new Audio("/audio/sample2.mp3");
    audioElement.loop = true;
    audioElement.autoplay = true;

    // Start playing the audio
    audioElement.play().catch((error) => {
      console.error("Error starting audio playback:", error);
    });
    setAudioTrack(audioElement);
  };

  return (
    <main
      data-lk-theme="default"
      className="h-full grid content-center bg-white"
    >
      <LiveKitRoom
        token={connectionDetails?.participantToken}
        serverUrl={connectionDetails?.serverUrl}
        connect={connectionDetails !== undefined}
        audio={true}
        video={false}
        onMediaDeviceFailure={onDeviceFailure}
        onDisconnected={() => {
          updateConnectionDetails(undefined);
          setAudioTrack(null); // SAMPLE AUDIO TEST - CAN BE REMOVED
          setIsAnimating(false);
        }}
        className="grid grid-rows-[2fr_1fr] items-center bg-white"
      >
        <SimpleVoiceAssistant
          onStateChange={setAgentState}
          isAnimating={isAnimating}
          audioTrack={audioTrack}
        />
        <ControlBar
          onConnectButtonClicked={onConnectButtonClicked}
          agentState={agentState}
          setIsAnimating={setIsAnimating}
          startAudio={startAudio}
        />
        <RoomAudioRenderer />
        <NoAgentNotification state={agentState} />
      </LiveKitRoom>
    </main>
  );
}

function SimpleVoiceAssistant(props: {
  onStateChange: (state: AgentState) => void;
  audioTrack: HTMLAudioElement | null;
  isAnimating: boolean;
}) {
  const { state, audioTrack } = useVoiceAssistant();
  useEffect(() => {
    props.onStateChange(state);
  }, [props, state]);


  useEffect(() => {
    // Clean up when component unmounts
    return () => {
      if (props.audioTrack) {
        props.audioTrack.pause();
        props.audioTrack.currentTime = 0;
      }
    };
  }, [props.audioTrack]);

  useEffect(() => {
    props.onStateChange(state); // Pass the state to the parent component
  }, [props, state]);
  return (
    <div className=" mx-auto relative h-full">
      <Visualizer
        // state={state}
        trackRef={audioTrack}
        isAnimating={props.isAnimating}
      />
    </div>
  );
}

function ControlBar(props: {
  onConnectButtonClicked: () => void;
  agentState: AgentState;
  setIsAnimating: (isAnimating: boolean) => void; // Add the setIsAnimating prop
  startAudio: () => void; // Add the startAudio prop
}) {
  /**
   * Use Krisp background noise reduction when available.
   * Note: This is only available on Scale plan, see {@link https://livekit.io/pricing | LiveKit Pricing} for more details.
   */
  const krisp = useKrispNoiseFilter();
  useEffect(() => {
    krisp.setNoiseFilterEnabled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartAConversationClicked = () => {
    props.onConnectButtonClicked();
    props.setIsAnimating(true);
    // props.startAudio();
  };

  return (
    <div className="relative h-[100px]">
      <AnimatePresence>
        {props.agentState === "disconnected" && (
          <motion.button
            initial={{ opacity: 0, top: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 1, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="uppercase absolute left-1/2 -translate-x-1/2 px-4 py-2 mt-20 bg-black text-white rounded-md"
            onClick={() => {
              handleStartAConversationClicked();
            }}
          >
            Start a conversation
          </motion.button>
        )}
      </AnimatePresence>
      <Link
        href={"/generate-story"}
        className="bg-black uppercase absolute mt-[140px] left-1/2 -translate-x-1/2 rounded-md px-4 py-2 text-white "
      >
        Generate a story
      </Link>
      <AnimatePresence>
        {props.agentState !== "disconnected" &&
          props.agentState !== "connecting" && (
            <motion.div
              initial={{ opacity: 0, top: "10px" }}
              animate={{ opacity: 1, top: 0 }}
              exit={{ opacity: 0, top: "-10px" }}
              transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
              className="flex h-8 absolute left-1/2 -translate-x-1/2  justify-center"
            >
              <VoiceAssistantControlBar controls={{ leave: false }} />
              <DisconnectButton>
                <CloseIcon />
              </DisconnectButton>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}

function onDeviceFailure(error?: MediaDeviceFailure) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}
