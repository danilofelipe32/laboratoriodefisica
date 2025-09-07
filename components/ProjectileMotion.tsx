import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from './ui/Card';
import { Slider } from './ui/Slider';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { CannonIcon, PlayIcon, PauseIcon, ResetIcon, SoundOnIcon, SoundOffIcon, InfoIcon } from './ui/Icons';

const GRAVITY = 9.81; // m/s^2

// --- Audio Assets ---
// Using pre-created Audio objects to prevent re-creation on re-renders.
// Sounds are encoded in Base64 to avoid needing separate files.
const LAUNCH_SOUND = new Audio('data:audio/wav;base64,UklGRooAAABXQVZFZm10IBAAAAABAAEAESsAAESsAAABAAgAZGF0YWYAAACw/v///f7I/NL5uvbL9sz3//73+7v40fLP7JHqW+VL4zvJc8170v/Mf8hAv2i/QL+av5b/Xv+T/1T/j/+M/4z/jv+P/5D/lf+a/6P/r/+2/8L/0//j//z//v4W/oH8GvqJ+b74g/gu+LX3vfcF+IL4TPkL+rD8Gv8bACsCSwO5BN8GnAe1CJgLewzvDm8QFBI1EwsUjBRWFhgY3RjLGeYblhxoHTMeJR5LHzEgLCHGIewiLiNoI8EjXSPRJc0nEihAKKco5insKzQr0CwwLNctGC5bLzAv+jBAABEERQSPBFAEZASeBLYESwS2BPYFBgWmBecGEAYhBiMGNAZNBmUGdwaHBoUGlgafBqkGrAbCBswG1AbYBuEG6AbxByMHQAdPB1sHYwdpB3sHggd7B5UHpwerB7UHwQfCB8sH0wffB+AH5gfrB+4H9ggCCAsIGQglCCsINQhACEMIUghfCGwIeQh/CJQIoAi0COwI/AkFCUoJZgl5CYcJoQm3CcsJ3wntChwKJgqUCqoKywraCt8K+wsMCw8LGwsjCzILPQtQC2ILcwt8C4MLjAuZC6ELrQvCC9kMFAxLDFkMdQyPDKcMtQzdDPwNCw0WDRgNJw0tDUINWA1gDW4Ngg2ODaINsQ2/DdIN3A3vDhgOGQ4kDjAOPQ5LDlYObQ59DpQOrw7UDu0PCQ8XDysPPQ9JD1YPaA98D5cPsQ/OD+IP/hAJECcQKhA0EEIQUhBiEGoQfhChEKsQvBDGEMwQ1hDoEPwRJhEsETARQBFYEZgRwhHSEeUSKxJNEoASnBKsEt0TAxMVExYTFxMaEyYTLhMyEzkTPhNBE0MTRhNKE1MTVBNbE2ETZxNoE2sTcxN2E3oTgROFE4kTlBOYE54ToBOlE6wTrhO2E74TwxPME9AT3RPlE+0T9hQAFAMUBhQJFA4UExQXFCQUJhQlFCcUKRQqFCwULhQyFDYUPRRAFFIUYxRlFGkUchR4FH8UihSTEJYUlxSXlJkUmxSdFKAUoxSoFKsUsBS0FLYUuBS7FMQUzRTaFN8U5xTzFPcU/RUCFQkVDhUSFRcVGhUpFS4VMxU8FUIVSBU/FVgVYhVnFXIVexWEFYwVkhWZFZwVoRWnFa8VtRXEFcgV1xXlFewV+hYCFiMWKRZCFkcWbxZ8FqUWxBbbFuYW+BcGFx4XKRczF0EXXRdsF4EXihexF8gX5RgQGB4YMBg/GFoYeBiCGJYYsRjKGNgY9xkaGSUaOBpOGm4ahhqQGrYaxBrmGvYa/BwBHCUcMRxAHFocfxynHLgczBzlHPwdAh0dHTQdRB1yHcUe1x8dICAgQSFYImAitiPsJEQkWCScJPglNCV4JfQmNCalJsYnESdaJ7goQChUKIAopCjQKVApqCnEKkArTitsLBAscCzELPgtTC3QLiguNC68L0wvqDBYMMgxIDFoMagyMDLUM3w0QDR0NQw1eDYgNpw28DdIN+w4ZDiwOPQ5TDnIOiw6tDr8O0g78DwMPFw8nDzQPRg9eD3oPmA+5D84QBhAQECoQPxBcEHkQohCnEM4Q6BEYESMRQhFeEbgR5xKAEowSvBLaEykTThOEE6ATsBPHE+kUCBQWFDQUXRR9FKgUvBTUFPEVBxUXFTsVWhZqFnwXABgLGCEYRRhuGIgZBxkgGWQabRsqG70cGx0bHjAfBh8sICQhRiJII0QkfiWYJq0nDCjVKlAtcy8CMO8xTTPBNTk3ATkvPTJBAUI8QjhFOkk8SUhNV09MUIVVdVd4WC9aRFp1W4VchV6UX/BgC2InZItmfmpZbV1veHJzeH15hHyAh4KJf4yKko2Vl5mZnp2goaSlqaqoq62usLGytba5uru+wcLGx8nLzM/Q0dLT1NXW19jZ2tvc3d7f4OHj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==');
const RESET_SOUND = new Audio('data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEAESsAAESsAAABAAgAZGF0YWEUAAAA////AgAFAAcACwANAA4ADQAMAAoABgACAP//+v/u/+z/7//w//H/8v/y//L/8//z//T/9f/2//f/9//4//n/+v/7//z//f/+///AAEAAQABAAECAP//+//6//n/+f/5//r/+//8//3//v//AAAAAQACAAIAAQAAAAAAAAD//v/9//7//v/9//3//f/9//3//f/9//3//f/9//3//f/8//v/+v/5//j/+P/4//j/+P/4//f/9//3//f/9v/2//b/9v/2//b/9v/2//b/9v/2//b/9v/2//b/9v/2//b/9v/2//b/9v/2//b/9v/2//b/9v/2//b/9v/2//b/9f/1//X/9f/1//X/9f/1//X/9f/1//X/9f/1//X/9f/1//X/9f/1//X/9f/1//X/9f/1//X/9f/1//T/9P/0//T/9P/0//T/9P/0//P/8//z//P/8//y//L/8v/x//H/8f/x//H/8P/w//D/8P/v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7//v//D/7-');

const ProjectileMotion: React.FC = () => {
  const [velocity, setVelocity] = useState(50);
  const [angle, setAngle] = useState(45);
  const [height, setHeight] = useState(0);

  const [isRunning, setIsRunning] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(100); // 0-100 percentage
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  
  const animationFrameId = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastProgressRef = useRef(0);
  const animationDuration = 3000; // 3 seconds for full trajectory animation

  /**
   * Helper function to play audio, respecting the user's sound preference.
   * It resets the audio to the beginning and handles potential browser autoplay restrictions.
   * @param audio The HTMLAudioElement to play.
   */
  const playSound = (audio: HTMLAudioElement) => {
    if (!isSoundEnabled) return;
    audio.currentTime = 0;
    audio.play().catch(error => {
      // This can happen if the user hasn't interacted with the page yet.
      // It's a browser security feature to prevent annoying autoplay.
      console.warn("Audio playback was prevented by the browser.", error);
    });
  };
  
  const trajectoryData = useMemo(() => {
    const angleRad = (angle * Math.PI) / 180;
    const v0x = velocity * Math.cos(angleRad);
    const v0y = velocity * Math.sin(angleRad);

    const timeOfFlight = (v0y + Math.sqrt(v0y ** 2 + 2 * GRAVITY * height)) / GRAVITY;
    
    const data = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * timeOfFlight;
        const x = v0x * t;
        const y = height + v0y * t - 0.5 * GRAVITY * t ** 2;
        if (y >= 0) {
            data.push({ time: t, x, y });
        }
    }
    // Ensure last point is on the ground
    const finalX = v0x * timeOfFlight;
    data.push({ time: timeOfFlight, x: finalX, y: 0 });
    
    return data;
  }, [velocity, angle, height]);
  
  const displayedTrajectory = useMemo(() => {
    const endIndex = Math.ceil(trajectoryData.length * (animationProgress / 100));
    return trajectoryData.slice(0, endIndex);
  }, [trajectoryData, animationProgress]);


  const calculations = useMemo(() => {
    const angleRad = (angle * Math.PI) / 180;
    const v0y = velocity * Math.sin(angleRad);

    const timeToMaxHeight = v0y / GRAVITY;
    const maxHeight = height + (v0y ** 2) / (2 * GRAVITY);
    const timeOfFlight = (v0y + Math.sqrt(v0y ** 2 + 2 * GRAVITY * height)) / GRAVITY;
    const range = velocity * Math.cos(angleRad) * timeOfFlight;

    return { maxHeight, range, timeOfFlight };
  }, [velocity, angle, height]);

  const step = (timestamp: number) => {
    if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
    }

    const elapsedSinceStart = timestamp - startTimeRef.current;
    const progress = Math.min((elapsedSinceStart / animationDuration) * 100, 100);
    const totalProgress = lastProgressRef.current + progress;

    if (totalProgress < 100) {
        setAnimationProgress(totalProgress);
        animationFrameId.current = requestAnimationFrame(step);
    } else {
        setAnimationProgress(100);
        setIsRunning(false);
        lastProgressRef.current = 0;
        startTimeRef.current = null;
    }
  };

  useEffect(() => {
    if (isRunning) {
        startTimeRef.current = null;
        animationFrameId.current = requestAnimationFrame(step);
    } else {
        lastProgressRef.current = animationProgress;
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    }
    return () => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const handlePlayPause = () => {
    // Only play launch sound if starting from the beginning.
    if (!isRunning && animationProgress >= 100) {
        setAnimationProgress(0);
        lastProgressRef.current = 0;
        playSound(LAUNCH_SOUND);
    }
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    playSound(RESET_SOUND);
    setIsRunning(false);
    setVelocity(50);
    setAngle(45);
    setHeight(0);
    setAnimationProgress(100);
    lastProgressRef.current = 0;
  };

  const handleControlChange = (setter: React.Dispatch<React.SetStateAction<number>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsRunning(false);
      setAnimationProgress(100);
      lastProgressRef.current = 0;
      setter(parseFloat(e.target.value));
  };


  const ResultCard: React.FC<{ title: string; value: string; unit: string }> = ({ title, value, unit }) => (
    <div className="bg-gray-900/50 p-4 rounded-lg text-center">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-orbitron font-bold text-sky-300">
        {value} <span className="text-base text-sky-500">{unit}</span>
      </p>
    </div>
  );

  const infoButton = (
    <button onClick={() => setIsInfoModalOpen(true)} className="text-gray-400 hover:text-sky-300 transition-colors" aria-label="Mais informações">
      <InfoIcon />
    </button>
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        <Card title="Controles" icon={<CannonIcon />} className="lg:col-span-1 h-fit" extra={infoButton}>
          <div className="space-y-6">
            <div className="flex space-x-2">
                <Button onClick={handlePlayPause} icon={isRunning ? <PauseIcon /> : <PlayIcon />} className="flex-1">
                    {isRunning ? 'Pausar' : 'Iniciar'}
                </Button>
                <Button onClick={handleReset} icon={<ResetIcon />} variant="secondary" className="flex-1">
                    Resetar
                </Button>
                <Button
                  onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                  icon={isSoundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
                  variant="secondary"
                  aria-label={isSoundEnabled ? 'Desativar som' : 'Ativar som'}
                  title={isSoundEnabled ? 'Desativar som' : 'Ativar som'}
                  className="px-3"
                />
            </div>
            <Slider
              label="Velocidade Inicial"
              value={velocity}
              min={1}
              max={200}
              step={1}
              unit="m/s"
              onChange={handleControlChange(setVelocity)}
            />
            <Slider
              label="Ângulo de Lançamento"
              value={angle}
              min={0}
              max={90}
              step={1}
              unit="°"
              onChange={handleControlChange(setAngle)}
            />
            <Slider
              label="Altura Inicial"
              value={height}
              min={0}
              max={100}
              step={1}
              unit="m"
              onChange={handleControlChange(setHeight)}
            />
          </div>
        </Card>

        <div className="lg:col-span-2 flex flex-col gap-8">
          <Card title="Visualização da Trajetória" className="flex-grow">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={displayedTrajectory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="x" type="number" name="Alcance" unit="m" stroke="#9CA3AF" domain={[0, 'dataMax']} />
                <YAxis dataKey="y" type="number" name="Altura" unit="m" stroke="#9CA3AF" domain={[0, 'dataMax']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5567' }}
                  labelStyle={{ color: '#E5E7EB' }}
                  formatter={(value, name) => [`${(value as number).toFixed(2)}m`, name]}
                />
                <Legend />
                <Line type="monotone" dataKey="y" stroke="#38BDF8" strokeWidth={2} dot={false} name="Altura" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ResultCard title="Altura Máxima" value={calculations.maxHeight.toFixed(2)} unit="m" />
              <ResultCard title="Alcance" value={calculations.range.toFixed(2)} unit="m" />
              <ResultCard title="Tempo de Voo" value={calculations.timeOfFlight.toFixed(2)} unit="s" />
          </div>
        </div>
      </div>
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Sobre o Movimento de Projétil"
      >
        <p>
          O <strong>Movimento de Projétil</strong> (ou lançamento oblíquo) descreve o movimento de um objeto lançado em um ângulo, sujeito apenas à força da gravidade. O movimento é decomposto em dois eixos independentes:
        </p>
        <div className="space-y-3 pt-2">
          <h4 className="font-semibold text-gray-100">Componentes do Movimento:</h4>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Eixo Horizontal (X):</strong> O objeto se move com velocidade constante (Movimento Retilíneo Uniforme - MRU), pois não há forças horizontais atuando (resistência do ar é desconsiderada).
              <ul className="list-['-_'] list-inside ml-4 mt-1 text-sm">
                  <li>Velocidade: <code className="bg-gray-900/50 text-sky-300 px-1 py-0.5 rounded-md">Vₓ = V₀ * cos(θ)</code></li>
                  <li>Posição: <code className="bg-gray-900/50 text-sky-300 px-1 py-0.5 rounded-md">X = Vₓ * t</code></li>
              </ul>
            </li>
            <li>
              <strong>Eixo Vertical (Y):</strong> O objeto é influenciado pela aceleração da gravidade (g), descrevendo um Movimento Retilíneo Uniformemente Variado (MRUV).
              <ul className="list-['-_'] list-inside ml-4 mt-1 text-sm">
                  <li>Velocidade Inicial: <code className="bg-gray-900/50 text-sky-300 px-1 py-0.5 rounded-md">V₀ᵧ = V₀ * sin(θ)</code></li>
                  <li>Velocidade: <code className="bg-gray-900/50 text-sky-300 px-1 py-0.5 rounded-md">Vᵧ = V₀ᵧ - g * t</code></li>
                  <li>Posição: <code className="bg-gray-900/50 text-sky-300 px-1 py-0.5 rounded-md">Y = H₀ + V₀ᵧ * t - (g * t²)/2</code></li>
              </ul>
            </li>
            <li>
              A combinação desses dois movimentos resulta na trajetória parabólica que observamos na simulação.
            </li>
          </ul>
        </div>
      </Modal>
    </>
  );
};

export default ProjectileMotion;