import { useRef, useEffect, useState } from "react";
import { ROULETTE_NUMBERS, RED_NUMBERS, ARC } from "../lib/roulette-data";

interface RouletteProps {
  isSpinning: boolean;
  onSpinEnd: (winningNumber: number) => void;
  serverVelocity?: number; // Add server velocity prop
}

const FONT_FAMILY = "'Georgia', 'Times New Roman', serif";
const MINIMUM_VELOCITY = 0.008;
const VELOCITY_DAMPENING = 0.991; // Dampen the velocity each frame

const Roulette = ({ isSpinning, onSpinEnd, serverVelocity }: RouletteProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelRotation = useRef(0);
  const rotationVelocity = useRef(0);
  const ballRotation = useRef(0);
  const isBallSpinning = useRef(false);
  const shouldResetWheel = useRef(false);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (highlightIndex !== null) {
      const interval = setInterval(() => setFlash((f) => !f), 150);
      return () => clearInterval(interval);
    } else {
      setFlash(false);
    }
  }, [highlightIndex]);

  useEffect(() => {
    if (isSpinning && !isBallSpinning.current) {
      isBallSpinning.current = true;
      // Ball starts at 0
      ballRotation.current = 0;

      // Use server velocity if provided, otherwise use random velocity
      if (serverVelocity !== undefined) {
        console.log("Using server velocity:", serverVelocity);
        rotationVelocity.current = serverVelocity;
      } else {
        console.log("Using fallback random velocity");
        const direction = Math.random() > 0.5 ? 1 : -1;
        rotationVelocity.current = direction * (Math.random() * 0.13 + 0.13);
      }

      setHighlightIndex(null);
    }
  }, [isSpinning, serverVelocity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setCanvasDimensions = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const { clientWidth, clientHeight } = parent;
        if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
          canvas.width = clientWidth;
          canvas.height = clientHeight;
        }
      }
    };

    const drawWheel = (
      rotation: number,
      highlightIdx: number | null,
      flash: boolean
    ) => {
      const radius = canvas.width / 2 - 20;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rotation);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      ROULETTE_NUMBERS.forEach((number, i) => {
        const angle = i * ARC;
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          canvas.width / 2,
          canvas.height / 2,
          radius,
          angle,
          angle + ARC
        );
        ctx.lineTo(canvas.width / 2, canvas.height / 2);

        // Flashing highlight effect
        if (highlightIdx === i && flash) {
          ctx.fillStyle = "#ffe066";
        } else if (number === 0) ctx.fillStyle = "green";
        else if (RED_NUMBERS.includes(number)) ctx.fillStyle = "red";
        else ctx.fillStyle = "black";
        ctx.fill();

        if (highlightIdx === i && flash) {
          ctx.shadowColor = "#fff700";
          ctx.shadowBlur = 64;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.restore();
        ctx.save();
        ctx.fillStyle = "white";
        ctx.font = `bold ${canvas.width / 26}px ${FONT_FAMILY}`;
        ctx.translate(
          canvas.width / 2 +
            Math.cos(angle + ARC / 2) * (radius - canvas.width / 18),
          canvas.height / 2 +
            Math.sin(angle + ARC / 2) * (radius - canvas.width / 18)
        );
        ctx.rotate(angle + ARC / 2 + Math.PI / 2);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeText(
          number.toString(),
          -ctx.measureText(number.toString()).width / 2,
          0
        );
        ctx.fillText(
          number.toString(),
          -ctx.measureText(number.toString()).width / 2,
          0
        );
        ctx.restore();
      });
      ctx.restore();
    };

    const drawBall = (rotation: number) => {
      const radius = canvas.width / 2 - 20;
      const ballRadius = radius - canvas.width / 10;
      ctx.beginPath();
      const x = canvas.width / 2 + Math.cos(rotation) * ballRadius;
      const y = canvas.height / 2 + Math.sin(rotation) * ballRadius;
      ctx.arc(x, y, canvas.width / 60, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    let animationFrameId: number;
    const animate = () => {
      setCanvasDimensions();
      // Only rotate wheel while spinning
      if (isBallSpinning.current) {
        wheelRotation.current += rotationVelocity.current;
        rotationVelocity.current *= VELOCITY_DAMPENING;
        // Ball rotates in opposite direction with same velocity
        ballRotation.current -= rotationVelocity.current;

        if (Math.abs(rotationVelocity.current) < MINIMUM_VELOCITY) {
          isBallSpinning.current = false;
          rotationVelocity.current = 0;

          // Calculate winning index based on the ball's absolute position relative to the wheel
          // The ball's position minus the wheel's rotation gives the absolute position over the wheel
          const absoluteBallAngle =
            (ballRotation.current - wheelRotation.current) % (Math.PI * 2);
          const positiveAngle =
            (absoluteBallAngle + Math.PI * 2) % (Math.PI * 2);
          let winningIndex = Math.floor(positiveAngle / ARC);
          if (winningIndex >= ROULETTE_NUMBERS.length) winningIndex = 0;
          const winningNumber = ROULETTE_NUMBERS[winningIndex];

          setHighlightIndex(winningIndex);

          setTimeout(() => {
            setHighlightIndex(null);
            onSpinEnd(winningNumber);
            shouldResetWheel.current = true;
          }, 1600);
        }
      } else if (shouldResetWheel.current) {
        // Smoothly animate back to 0
        const distanceToZero = wheelRotation.current % (Math.PI * 2);
        if (Math.abs(distanceToZero) < 0.01) {
          wheelRotation.current = 0;
          shouldResetWheel.current = false;
        } else {
          // Determine shortest path to 0 (clockwise or counterclockwise)
          const targetRotation = distanceToZero > Math.PI ? Math.PI * 2 : 0;
          const diff = targetRotation - distanceToZero;
          wheelRotation.current += diff * 0.1; // Smooth interpolation
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2 - 16,
        0,
        Math.PI * 2
      );
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#f2d49b";
      ctx.shadowColor = "#f2d49b";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();

      drawWheel(wheelRotation.current, highlightIndex, flash);

      if (isBallSpinning.current) {
        drawBall(ballRotation.current);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [onSpinEnd, highlightIndex, flash]);

  return <canvas ref={canvasRef} />;
};

export default Roulette;
