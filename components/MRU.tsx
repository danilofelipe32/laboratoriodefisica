import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from './ui/Card';
import { Slider } from './ui/Slider';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { MruIcon, PlayIcon, PauseIcon, ResetIcon, InfoIcon } from './ui/Icons';

const MRU: React.FC = () => {
  const [initialPosition, setInitialPosition] = useState(0);
  const [velocity, setVelocity] = useState(10);
  const [totalTime, setTotalTime] = useState(10);

  const [isRunning, setIsRunning] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const currentPosition = useMemo(() => {
    return initialPosition + velocity * elapsedTime;
  }, [initialPosition, velocity, elapsedTime]);

  const chartData = useMemo(() => {
    const data = [];
    for (let t = 0; t <= totalTime; t += totalTime/100) {
      data.push({
        time: t,
        position: initialPosition + velocity * t,
      });
    }
    return data;
  }, [initialPosition, velocity, totalTime]);

  const displayedChartData = useMemo(() => {
      const steps = Math.floor(elapsedTime / (totalTime/100)) + 1;
      return chartData.slice(0, steps);
  }, [chartData, elapsedTime, totalTime]);

  const animate = (timestamp: number) => {
    if (lastTimeRef.current === null) {
      lastTimeRef.current = timestamp;
    }
    const deltaTime = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    setElapsedTime(prevTime => {
      const newTime = prevTime + deltaTime;
      if (newTime >= totalTime) {
        setIsRunning(false);
        return totalTime;
      }
      return newTime;
    });

    animationFrameId.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isRunning) {
      lastTimeRef.current = null;
      animationFrameId.current = requestAnimationFrame(animate);
    } else {
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    
    const posStart = initialPosition;
    const posEnd = initialPosition + velocity * totalTime;
    const padding = Math.abs(posEnd - posStart) * 0.1 || 5;
    const minWorldX = Math.min(posStart, posEnd) - padding;
    const maxWorldX = Math.max(posStart, posEnd) + padding;
    const worldWidth = maxWorldX - minWorldX;

    const mapX = (worldX: number) => {
        if (worldWidth === 0) return width / 2;
        return ((worldX - minWorldX) / worldWidth) * width;
    }

    ctx.strokeStyle = '#4A5568';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    const originX = mapX(0);
    ctx.strokeStyle = '#6B7280';
    ctx.beginPath();
    ctx.moveTo(originX, height / 2 - 5);
    ctx.lineTo(originX, height / 2 + 5);
    ctx.stroke();
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px Roboto';
    ctx.textAlign = 'center';
    ctx.fillText('0m', originX, height / 2 + 20);

    const objectX = mapX(currentPosition);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(objectX, height / 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = '10px Roboto';
    ctx.textAlign = 'center';
    ctx.fillText('S', objectX, height/2 + 3);

  }, [currentPosition, initialPosition, velocity, totalTime]);

  const handlePlayPause = () => {
    if (elapsedTime >= totalTime) {
      setElapsedTime(0);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setInitialPosition(0);
    setVelocity(10);
    setTotalTime(10);
  };
  
  const handleControlChange = (setter: React.Dispatch<React.SetStateAction<number>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsRunning(false);
    setElapsedTime(0);
    setter(parseFloat(e.target.value));
  };
  
  const infoButton = (
    <button onClick={() => setIsInfoModalOpen(true)} className="text-gray-400 hover:text-sky-300 transition-colors" aria-label="Mais informações">
      <InfoIcon />
    </button>
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        <Card title="Controles MRU" icon={<MruIcon />} className="lg:col-span-1 h-fit" extra={infoButton}>
          <div className="space-y-6">
            <div className="flex space-x-2">
              <Button onClick={handlePlayPause} icon={isRunning ? <PauseIcon /> : <PlayIcon />} className="flex-1">
                {isRunning ? 'Pausar' : 'Iniciar'}
              </Button>
              <Button onClick={handleReset} icon={<ResetIcon />} variant="secondary" className="flex-1">
                Resetar
              </Button>
            </div>
            <Slider label="Posição Inicial (S₀)" value={initialPosition} min={-50} max={50} step={1} unit="m" onChange={handleControlChange(setInitialPosition)} />
            <Slider label="Velocidade (v)" value={velocity} min={-50} max={50} step={1} unit="m/s" onChange={handleControlChange(setVelocity)} />
            <Slider label="Tempo Total" value={totalTime} min={1} max={30} step={1} unit="s" onChange={handleControlChange(setTotalTime)} />
            <div className="pt-4 border-t border-gray-700/60 text-center">
              <p className="text-sm text-gray-400">Equação do Movimento</p>
              <p className="text-lg font-mono text-sky-300">S = {initialPosition.toFixed(1)} + ({velocity.toFixed(1)} * t)</p>
            </div>
          </div>
        </Card>
        
        <div className="lg:col-span-2 flex flex-col gap-8">
          <Card title="Visualização" className="flex-grow flex flex-col">
            <div className="w-full h-24 p-4 bg-gray-900/50 rounded-t-lg">
              <canvas ref={canvasRef} width="600" height="70" className="w-full h-full"/>
            </div>
            <div className="flex-grow p-2">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={displayedChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                  <XAxis dataKey="time" type="number" name="Tempo" unit="s" stroke="#9CA3AF" domain={[0, totalTime]} allowDecimals={false} />
                  <YAxis dataKey="position" type="number" name="Posição" unit="m" stroke="#9CA3AF" domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5567' }} />
                  <Legend verticalAlign="top" height={36}/>
                  <Line type="monotone" dataKey="position" stroke="#38BDF8" strokeWidth={2} dot={false} name="Posição (S)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-400">Tempo Decorrido</p>
                  <p className="text-2xl font-orbitron font-bold text-sky-300">{elapsedTime.toFixed(2)} <span className="text-base text-sky-500">s</span></p>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-400">Posição Atual</p>
                  <p className="text-2xl font-orbitron font-bold text-sky-300">{currentPosition.toFixed(2)} <span className="text-base text-sky-500">m</span></p>
              </div>
          </div>
        </div>
      </div>
      <Modal
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          title="Sobre o Movimento Retilíneo Uniforme (MRU)"
      >
          <p>
          O <strong>Movimento Retilíneo Uniforme (MRU)</strong> é o tipo de movimento mais simples, caracterizado por uma trajetória em linha reta e uma velocidade que permanece constante ao longo do tempo.
          </p>
          <div className="space-y-3 pt-2">
          <h4 className="font-semibold text-gray-100">Características Principais:</h4>
          <ul className="list-disc list-inside space-y-2">
              <li>
              <strong>Velocidade Constante (v):</strong> O objeto não acelera nem desacelera. Ele percorre distâncias iguais em intervalos de tempo iguais.
              </li>
              <li>
              <strong>Aceleração Nula (a = 0):</strong> Como a velocidade não muda, a aceleração é sempre zero.
              </li>
              <li>
              <strong>Equação Horária da Posição:</strong> A posição (S) de um objeto em qualquer instante de tempo (t) pode ser calculada com a fórmula:
              <div className="my-2 text-center p-2 bg-gray-900/50 rounded-md">
                  <code className="text-sky-300 text-lg">S = S₀ + v * t</code>
              </div>
              Onde <strong>S₀</strong> é a posição inicial e <strong>v</strong> é a velocidade constante.
              </li>
              <li>
              <strong>Gráfico Posição vs. Tempo:</strong> O gráfico S vs. t é sempre uma linha reta, cuja inclinação representa a velocidade do objeto.
              </li>
          </ul>
          </div>
      </Modal>
    </>
  );
};

export default MRU;