"use client";
import React, { useEffect, useRef, useState } from "react";
import { AgentState, TrackReference } from "@livekit/components-react";

interface VisualizerProps {
  state: AgentState;
  trackRef: TrackReference | undefined;
  isAnimating: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({
  state,
  trackRef,
  isAnimating,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const [scaleFactor, setScaleFactor] = useState(1); // State to track the scale factor

  useEffect(() => {
    if (!trackRef?.publication || !trackRef.publication.track) return;

    const track = trackRef.publication.track;

    // Ensure track is an audio track
    if (track.kind !== "audio") {
      console.warn("Visualizer only works with audio tracks.");
      return;
    }

    // Initialize audio context and analyser
    const audioContext = new (window.AudioContext || window.AudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256; // Controls the data resolution
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Create a MediaStream from the track and connect to the analyser
    const mediaStream = new MediaStream([track.mediaStreamTrack]);
    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const draw = () => {
      if (!analyserRef.current || !ctx) return;

      // Get frequency data
      analyserRef.current.getByteFrequencyData(dataArray);

      // Dynamically calculate the max frequency and use it to scale the canvas dimensions
      const maxFrequency = Math.max(...Array.from(dataArray));

      // Calculate the scale factor based on the maximum frequency (loudness)
      const newScaleFactor = (maxFrequency / 250) * 0.5 + 1; // Dynamic scaling based on frequency amplitude
      setScaleFactor(newScaleFactor); // Update the scaleFactor state

      // Calculate the new size for the canvas and the wrapper div based on the scale factor
      const newSize = 200 * newScaleFactor; // Starting size of 300px, adjusted by scaleFactor
      canvas.width = newSize;
      canvas.height = newSize;

      // Clear the canvas before drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw a dynamic circle based on the maximum frequency
      // Continue the animation
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    // Cleanup resources when unmounting
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [trackRef]);

  const getCircumference = (radius: number) => 2 * Math.PI * radius;

  console.log("state", state);

  return (
    <div className="h-full w-full relative flex items-center justify-center z-0">
      {/* Outer Circle3 */}
      <svg
        width="350"
        height="350"
        className="transform rotate-[90deg] absolute"
      >
        <circle
          cx="175"
          cy="175"
          r={isAnimating ? 165 : 155}
          stroke={"#FCF5F0"}
          strokeWidth="17"
          fill="none"
          strokeDasharray={getCircumference(isAnimating ? 165 : 155)}
          strokeDashoffset={
            isAnimating ? "0" : getCircumference(isAnimating ? 165 : 155) / 2
          }
          className="transition-all duration-[1300ms] ease-in-out"
        />
      </svg>

      {/* Outer Circle2 */}
      <svg
        width="350"
        height="350"
        className="transform rotate-[120deg] absolute"
      >
        <circle
          cx="175"
          cy="175"
          r={isAnimating ? 135 : 125}
          stroke={scaleFactor > 1.4 && isAnimating ? "#A7E7B9" : "#FCF5F0"}
          strokeWidth="17"
          fill="none"
          strokeDasharray={getCircumference(isAnimating ? 135 : 125)}
          strokeDashoffset={
            isAnimating ? "0" : getCircumference(isAnimating ? 135 : 125) / 2
          }
          className="transition-all duration-[1200ms] ease-in-out"
        />
      </svg>

      {/* Outer Circle */}
      <svg
        width="350"
        height="350"
        className="transform rotate-[110deg] absolute"
      >
        <circle
          cx="175"
          cy="175"
          r={isAnimating ? 105 : 95}
          stroke={scaleFactor > 1.4 && isAnimating ? "#A7E7B9" : "#FCF5F0"}
          strokeWidth="17"
          fill="none"
          strokeDasharray={getCircumference(isAnimating ? 105 : 95)}
          strokeDashoffset={
            isAnimating ? "0" : getCircumference(isAnimating ? 105 : 95) / 2
          }
          className="transition-all duration-[1100ms] ease-in-out"
        />
      </svg>

      {/* Inner Circle */}
      <svg
        width="350"
        height="350"
        className="transform rotate-[90deg] relative"
      >
        <circle
          cx="175"
          cy="175"
          r={isAnimating ? 75 : 65}
          stroke={scaleFactor > 1.4 && isAnimating ? "#A7E7B9" : "#FCF5F0"}
          strokeWidth="17"
          fill="none"
          strokeDasharray={getCircumference(isAnimating ? 75 : 65)}
          strokeDashoffset={
            isAnimating ? "0" : getCircumference(isAnimating ? 75 : 65) / 2
          }
          className="transition-all duration-[1000ms] ease-in-out"
        />
      </svg>

      {/* Core */}
      <div
        className={`flex flex-col justify-center rounded-full ${
          scaleFactor === 1 && "transition-all duration-1000 delay-300"
        } ${
          state === "listening" && "animate-heartbeat"
        } absolute z-10 bg-gradient-to-t from-[#16A34A] max-h-[105px] max-w-[105px] via-[#A7E7B9] to-[#FCF5F0]`}
        style={{
          width: `${isAnimating ? 80 * scaleFactor : "0"}px`,
          height: `${isAnimating ? 80 * scaleFactor : "0"}px`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={80 * scaleFactor}
          height={80 * scaleFactor}
          style={{
            borderRadius: "50%",
          }}
        />
      </div>
    </div>
  );
};

export default Visualizer;
