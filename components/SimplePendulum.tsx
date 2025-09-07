import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Card } from './ui/Card';
import { Slider } from './ui/Slider';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { PendulumIcon, PlayIcon, PauseIcon, ResetIcon, InfoIcon } from './ui/Icons';

const EnergyBar: React.FC<{ label: string; value: number; max: number; color: string; unit: string }> = ({ label, value, max, color, unit }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm font-mono text-sky-300">{value.toFixed(2)} {unit}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all duration-150 ease-linear`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

const SimplePendulum: React.FC = () => {
  const [length, setLength] = useState(2); // meters
  const [mass, setMass] = useState(1); // kg
  const [initialAngle, setInitialAngle] = useState(30); // degrees
  const [gravity, setGravity] = useState(9.81); // m/s^2

  const [isRunning, setIsRunning] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationState = useRef({
    angle: (initialAngle * Math.PI) / 180,
    angularVelocity: 0,
    time: 0,
    lastUpdateTime: 0,
  });

  const calculations = useMemo(() => {
    const initialAngleRad = (initialAngle * Math.PI) / 180;
    const currentAngleRad = simulationState.current.angle;
    
    // The period and frequency are based on the SHM approximation, which now matches the simulation physics.
    const period = 2 * Math.PI * Math.sqrt(length / gravity);
    const frequency = 1 / period;

    // Total energy is constant and based on the initial potential energy in the SHM model.
    const totalEnergy = 0.5 * mass * gravity * length * Math.pow(initialAngleRad, 2);
    
    // In SHM, potential energy is approximated as U = 1/2 * m * g * L * θ^2
    const potentialEnergy = 0.5 * mass * gravity * length * Math.pow(currentAngleRad, 2);
    
    // Kinetic energy is the remainder
    const kineticEnergy = Math.max(0, totalEnergy - potentialEnergy);

    return { period, frequency, potentialEnergy, kineticEnergy, totalEnergy };
  }, [length, gravity, mass, initialAngle, simulationState.current.angle]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const pivot = { x: width / 2, y: height / 4 };
    const pixelScale = 80; // pixels per meter
    const bobRadius = 10 + mass;

    const bobX = pivot.x + length * pixelScale * Math.sin(simulationState.current.angle);
    const bobY = pivot.y + length * pixelScale * Math.cos(simulationState.current.angle);

    // Draw pivot
    ctx.fillStyle = '#9CA3AF';
    ctx.fillRect(pivot.x - 20, pivot.y - 5, 40, 10);

    // Draw string
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    // Draw bob
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.stroke();

  }, [length, mass]);

  useEffect(() => {
    draw();
  }, [draw, calculations]);

  useEffect(() => {
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (simulationState.current.lastUpdateTime > 0) {
        const deltaTime = (timestamp - simulationState.current.lastUpdateTime) / 1000; // in seconds
        
        // SHM approximation: angular acceleration α = -(g/L)θ
        const angularAcceleration = -(gravity / length) * simulationState.current.angle;
        simulationState.current.angularVelocity += angularAcceleration * deltaTime;
        // Damping
        simulationState.current.angularVelocity *= 0.999; 
        simulationState.current.angle += simulationState.current.angularVelocity * deltaTime;
        simulationState.current.time += deltaTime;
      }
      simulationState.current.lastUpdateTime = timestamp;
      
      draw();
      animationFrameId = requestAnimationFrame(animate);
    };

    if (isRunning) {
      simulationState.current.lastUpdateTime = performance.now();
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning, gravity, length, draw]);
  
  const resetState = useCallback(() => {
    setIsRunning(false);
    const newAngleRad = (initialAngle * Math.PI) / 180;
    simulationState.current = {
      angle: newAngleRad,
      angularVelocity: 0,
      time: 0,
      lastUpdateTime: 0,
    };
     // Force a redraw
    setTimeout(draw, 0);
  }, [initialAngle, draw]);

  useEffect(() => {
    resetState();
  }, [length, mass, initialAngle, gravity, resetState]);

  const handleReset = () => {
    setLength(2);
    setMass(1);
    setInitialAngle(30);
    setGravity(9.81);
    // State will be reset by the useEffect hook watching these values
  };
  
  const infoButton = (
    <button onClick={() => setIsInfoModalOpen(true)} className="text-gray-400 hover:text-sky-300 transition-colors" aria-label="Mais informações">
      <InfoIcon />
    </button>
  );

  const ResultCard: React.FC<{ title: string; value: string; unit: string }> = ({ title, value, unit }) => (
    <div className="bg-gray-900/50 p-3 rounded-lg text-center">
      <p className="text-xs text-gray-400">{title}</p>
      <p className="text-xl font-orbitron font-bold text-sky-300">
        {value} <span className="text-sm text-sky-500">{unit}</span>
      </p>
    </div>
  );

  return (
    <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        <Card title="Controles do Pêndulo" icon={<PendulumIcon />} className="lg:col-span-1 h-fit" extra={infoButton}>
            <div className="space-y-6">
            <div className="flex space-x-2">
                <Button onClick={() => setIsRunning(!isRunning)} icon={isRunning ? <PauseIcon /> : <PlayIcon />} className="flex-1">
                {isRunning ? 'Pausar' : 'Iniciar'}
                </Button>
                <Button onClick={handleReset} icon={<ResetIcon />} variant="secondary" className="flex-1">
                Resetar
                </Button>
            </div>
            <Slider label="Comprimento (L)" value={length} min={0.5} max={5} step={0.1} unit="m" onChange={(e) => setLength(parseFloat(e.target.value))} />
            <Slider label="Massa (m)" value={mass} min={0.1} max={5} step={0.1} unit="kg" onChange={(e) => setMass(parseFloat(e.target.value))} />
            <Slider label="Ângulo Inicial (θ₀)" value={initialAngle} min={1} max={90} step={1} unit="°" onChange={(e) => setInitialAngle(parseFloat(e.target.value))} />
            <Slider label="Gravidade (g)" value={gravity} min={1} max={25} step={0.1} unit="m/s²" onChange={(e) => setGravity(parseFloat(e.target.value))} />
            </div>
        </Card>

        <div className="lg:col-span-2 flex flex-col gap-8">
            <Card title="Visualização e Energia" className="flex-grow flex flex-col">
            <div className="w-full h-80 bg-gray-900/50 rounded-t-lg">
                <canvas ref={canvasRef} width="600" height="320" className="w-full h-full"/>
            </div>
            <div className="p-4 pt-6 space-y-4 border-t border-gray-700/60">
                <EnergyBar
                    label="E. Cinética"
                    value={calculations.kineticEnergy}
                    max={calculations.totalEnergy || 1}
                    color="bg-sky-400"
                    unit="J"
                />
                <EnergyBar
                    label="E. Potencial"
                    value={calculations.potentialEnergy}
                    max={calculations.totalEnergy || 1}
                    color="bg-amber-400"
                    unit="J"
                />
            </div>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ResultCard title="Período" value={calculations.period.toFixed(2)} unit="s" />
                <ResultCard title="Frequência" value={calculations.frequency.toFixed(2)} unit="Hz" />
                <ResultCard title="Energia Total" value={calculations.totalEnergy.toFixed(2)} unit="J" />
            </div>
        </div>
        </div>
        <Modal
            isOpen={isInfoModalOpen}
            onClose={() => setIsInfoModalOpen(false)}
            title="Sobre a Simulação: Pêndulo Simples"
        >
            <p>
            Esta simulação demonstra o comportamento de um <strong>Pêndulo Simples</strong>, um modelo idealizado que consiste em uma massa pontual suspensa por um fio inextensível e de massa desprezível.
            </p>
            <p>
            Para pequenos ângulos de oscilação (geralmente &lt; 15°), o movimento do pêndulo se aproxima muito do <strong>Movimento Harmônico Simples (MHS)</strong>. Esta simulação utiliza a física do MHS para calcular o movimento.
            </p>
            <div className="space-y-3 pt-2">
            <h4 className="font-semibold text-gray-100">Conceitos Chave:</h4>
            <ul className="list-disc list-inside space-y-2">
                <li>
                <strong>Período (T):</strong> O tempo para completar uma oscilação completa (ida e volta). No MHS, ele não depende da massa nem da amplitude inicial, apenas do comprimento (L) e da gravidade (g). A fórmula é: <code className="bg-gray-900/50 text-sky-300 px-1.5 py-0.5 rounded-md text-sm">T = 2π√(L/g)</code>
                </li>
                <li>
                <strong>Frequência (f):</strong> O número de oscilações por segundo. É o inverso do período: <code className="bg-gray-900/50 text-sky-300 px-1.5 py-0.5 rounded-md text-sm">f = 1/T</code>
                </li>
                <li>
                <strong>Conservação de Energia:</strong> A energia mecânica total do sistema (cinética + potencial) permanece constante. A simulação mostra a conversão contínua entre a energia potencial (máxima nos extremos) e a energia cinética (máxima no ponto mais baixo).
                <ul className="list-['-_'] list-inside ml-4 mt-1 text-sm">
                    <li>Energia Potencial (MHS): <code className="bg-gray-900/50 text-sky-300 px-1 py-0.5 rounded-md">Eₚ ≈ ½mgLθ²</code></li>
                    <li>Energia Cinética: <code className="bg-gray-900/50 text-sky-300 px-1 py-0.5 rounded-md">Eₖ = E_total - Eₚ</code></li>
                </ul>
                </li>
            </ul>
            </div>
        </Modal>
    </>
  );
};

export default SimplePendulum;