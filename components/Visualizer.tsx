"use client";
import React, { useEffect, useRef, useState } from "react";
// import { TrackReference } from "@livekit/components-react";

interface VisualizerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state?: any; // Optional, replace with a specific type if known
  trackRef: HTMLAudioElement | null;
}

// const Visualizer: React.FC<VisualizerProps> = ({ trackRef }) => {
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);
//   const audioContextRef = useRef<AudioContext | null>(null);
//   const analyserRef = useRef<AnalyserNode | null>(null);
//   const animationRef = useRef<number | null>(null);

//   useEffect(() => {
//     if (!trackRef?.publication || !trackRef.publication.track) return;

//     const track = trackRef.publication.track;

//     // Ensure track is an audio track
//     if (track.kind !== "audio") {
//       console.warn("Visualizer only works with audio tracks.");
//       return;
//     }

//     // Initialize audio context and analyser
//     const audioContext = new (window.AudioContext || window.AudioContext)();
//     const analyser = audioContext.createAnalyser();
//     analyser.fftSize = 256; // Controls the data resolution
//     const dataArray = new Uint8Array(analyser.frequencyBinCount);

//     // Create a MediaStream from the track and connect to the analyser
//     const mediaStream = new MediaStream([track.mediaStreamTrack]);
//     const source = audioContext.createMediaStreamSource(mediaStream);
//     source.connect(analyser);
//     analyser.connect(audioContext.destination);

//     audioContextRef.current = audioContext;
//     analyserRef.current = analyser;

//     const canvas = canvasRef.current;
//     const ctx = canvas?.getContext("2d");
//     if (!ctx || !canvas) return;

//     const draw = () => {
//       if (!analyserRef.current || !ctx) return;

//       // Get frequency data
//       analyserRef.current.getByteFrequencyData(dataArray);

//       const radius = Math.max(...Array.from(dataArray)) / 2; // Scale radius by max frequency
//       const gradient = ctx.createRadialGradient(
//         canvas.width / 2,
//         canvas.height / 2,
//         10,
//         canvas.width / 2,
//         canvas.height / 2,
//         radius
//       );
//       gradient.addColorStop(0, "rgba(255, 99, 132, 1)");
//       gradient.addColorStop(0.5, "rgba(54, 162, 235, 0.8)");
//       gradient.addColorStop(1, "rgba(255, 206, 86, 0.5)");

//       // Clear the canvas
//       ctx.clearRect(0, 0, canvas.width, canvas.height);

//       // Draw the expanding circle
//       ctx.beginPath();
//       ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
//       ctx.fillStyle = gradient;
//       ctx.fill();
//       ctx.closePath();

//       // Continue the animation
//       animationRef.current = requestAnimationFrame(draw);
//     };

//     draw();

//     // Cleanup resources when unmounting
//     return () => {
//       if (animationRef.current) cancelAnimationFrame(animationRef.current);
//       if (audioContextRef.current) audioContextRef.current.close();
//     };
//   }, [trackRef]);

//   return (
//     <div className="visualizer-wrapper">
//       <canvas ref={canvasRef} width={300} height={300} className="visualizer-canvas" />
//     </div>
//   );
// };

const Visualizer: React.FC<VisualizerProps> = ({ trackRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const [scaleFactor, setScaleFactor] = useState(1); // State to track the scale factor

  useEffect(() => {
    if (!trackRef) return;

    // Initialize audio context and analyser
    const audioContext = new (window.AudioContext || window.AudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256; // Controls the data resolution
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Connect the audio track to the analyser
    const source = audioContext.createMediaElementSource(trackRef);
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
      const newScaleFactor = (maxFrequency / 500) * 0.5 + 1; // Dynamic scaling based on frequency amplitude
      setScaleFactor(newScaleFactor); // Update the scaleFactor state

      // Calculate the new size for the canvas and the wrapper div based on the scale factor
      const newSize = 300 * newScaleFactor; // Starting size of 300px, adjusted by scaleFactor
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

  return (
    <div className="flex h-full w-full justify-center items-center">
      <div
        className="visualizer-wrapper"
        style={{
          width: `${300 * scaleFactor}px`,
          height: `${300 * scaleFactor}px`,
          transformOrigin: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="visualizer-canvas"
        />
      </div>
    </div>
  );
};

export default Visualizer;
