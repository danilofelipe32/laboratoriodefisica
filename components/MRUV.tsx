import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from './ui/Card';
import { Slider } from './ui/Slider';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { MruvIcon, PlayIcon, PauseIcon, ResetIcon, InfoIcon } from './ui/Icons';

const MRUV: React.FC = () => {
  const [initialPosition, setInitialPosition] = useState(0);
  const [initialVelocity, setInitialVelocity] = useState(5);
  const [acceleration, setAcceleration] = useState(2);
  const [totalTime, setTotalTime] = useState(10);

  const [isRunning, setIsRunning] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentValues = useMemo(() => {
    const t = elapsedTime;
    const position = initialPosition + initialVelocity * t + 0.5 * acceleration * t * t;
    const velocity = initialVelocity + acceleration * t;
    return { position, velocity };
  }, [initialPosition, initialVelocity, acceleration, elapsedTime]);

  const chartData = useMemo(() => {
    const data = [];
    for (let t = 0; t <= totalTime; t += totalTime / 100) {
      data.push({
        time: t,
        position: initialPosition + initialVelocity * t + 0.5 * acceleration * t * t,
        velocity: initialVelocity + acceleration * t,
      });
    }
    return data;
  }, [initialPosition, initialVelocity, acceleration, totalTime]);
  
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

    const allPositions = chartData.map(d => d.position);
    const minWorldX = Math.min(...allPositions);
    const maxWorldX = Math.max(...allPositions);
    const padding = (maxWorldX - minWorldX) * 0.1 || 5;
    const worldStart = minWorldX - padding;
    const worldEnd = maxWorldX + padding;
    const worldWidth = worldEnd - worldStart;

    const mapX = (worldX: number) => {
      if (worldWidth === 0) return width / 2;
      return ((worldX - worldStart) / worldWidth) * width;
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

    const objectX = mapX(currentValues.position);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(objectX, height / 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = '10px Roboto';
    ctx.textAlign = 'center';
    ctx.fillText('S', objectX, height/2 + 3);

  }, [currentValues.position, chartData]);

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
    setInitialVelocity(5);
    setAcceleration(2);
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
        <Card title="Controles MRUV" icon={<MruvIcon />} className="lg:col-span-1 h-fit" extra={infoButton}>
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
            <Slider label="Velocidade Inicial (v₀)" value={initialVelocity} min={-50} max={50} step={1} unit="m/s" onChange={handleControlChange(setInitialVelocity)} />
            <Slider label="Aceleração (a)" value={acceleration} min={-10} max={10} step={0.1} unit="m/s²" onChange={handleControlChange(setAcceleration)} />
            <Slider label="Tempo Total" value={totalTime} min={1} max={30} step={1} unit="s" onChange={handleControlChange(setTotalTime)} />
            <div className="pt-4 border-t border-gray-700/60 text-center">
              <p className="text-sm text-gray-400">Equação da Posição</p>
              <p className="text-sm font-mono text-sky-300">S = {initialPosition.toFixed(1)} + {initialVelocity.toFixed(1)}*t + ({acceleration.toFixed(1)}*t²)/2</p>
            </div>
          </div>
        </Card>
        
        <div className="lg:col-span-2 flex flex-col gap-8">
          <Card title="Visualização e Gráficos" className="flex-grow flex flex-col">
            <div className="w-full h-24 p-4 bg-gray-900/50 rounded-t-lg">
              <canvas ref={canvasRef} width="600" height="70" className="w-full h-full"/>
            </div>
            <div className="flex-grow p-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={displayedChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                  <XAxis dataKey="time" type="number" name="Tempo" unit="s" stroke="#9CA3AF" domain={[0, totalTime]} allowDecimals={false}/>
                  <YAxis dataKey="position" type="number" name="Posição" unit="m" stroke="#9CA3AF" domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5567' }} />
                  <Legend verticalAlign="top" height={36}/>
                  <Line type="monotone" dataKey="position" stroke="#38BDF8" strokeWidth={2} dot={false} name="Posição (S)" />
                </LineChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={displayedChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                  <XAxis dataKey="time" type="number" name="Tempo" unit="s" stroke="#9CA3AF" domain={[0, totalTime]} allowDecimals={false}/>
                  <YAxis dataKey="velocity" type="number" name="Velocidade" unit="m/s" stroke="#9CA3AF" domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5567' }} />
                  <Legend verticalAlign="top" height={36}/>
                  <Line type="monotone" dataKey="velocity" stroke="#84CC16" strokeWidth={2} dot={false} name="Velocidade (V)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-400">Tempo</p>
                  <p className="text-2xl font-orbitron font-bold text-sky-300">{elapsedTime.toFixed(2)} <span className="text-base text-sky-500">s</span></p>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-400">Posição</p>
                  <p className="text-2xl font-orbitron font-bold text-sky-300">{currentValues.position.toFixed(2)} <span className="text-base text-sky-500">m</span></p>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-400">Velocidade</p>
                  <p className="text-2xl font-orbitron font-bold text-sky-300">{currentValues.velocity.toFixed(2)} <span className="text-base text-sky-500">m/s</span></p>
              </div>
          </div>
        </div>
      </div>
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Sobre o Movimento Retilíneo Uniformemente Variado (MRUV)"
      >
        <p>
          O <strong>Movimento Retilíneo Uniformemente Variado (MRUV)</strong> descreve o movimento de um objeto em linha reta com <strong>aceleração constante</strong>. Isso significa que a velocidade do objeto muda a uma taxa constante.
        </p>
        <div className="space-y-3 pt-2">
          <h4 className="font-semibold text-gray-100">Equações Fundamentais:</h4>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Equação Horária da Velocidade:</strong> Descreve como a velocidade (v) muda com o tempo (t).
              <div className="my-2 text-center p-2 bg-gray-900/50 rounded-md">
                <code className="text-sky-300 text-lg">v = v₀ + a * t</code>
              </div>
              Onde <strong>v₀</strong> é a velocidade inicial e <strong>a</strong> é a aceleração.
            </li>
            <li>
              <strong>Equação Horária da Posição:</strong> Calcula a posição (S) do objeto em qualquer instante de tempo.
              <div className="my-2 text-center p-2 bg-gray-900/50 rounded-md">
                <code className="text-sky-300 text-lg">S = S₀ + v₀*t + (a*t²)/2</code>
              </div>
              Onde <strong>S₀</strong> é a posição inicial.
            </li>
            <li>
              <strong>Gráficos:</strong> No MRUV, o gráfico da Posição vs. Tempo é uma <strong>parábola</strong>, enquanto o gráfico da Velocidade vs. Tempo é uma <strong>linha reta inclinada</strong>.
            </li>
          </ul>
        </div>
      </Modal>
    </>
  );
};

export default MRUV;