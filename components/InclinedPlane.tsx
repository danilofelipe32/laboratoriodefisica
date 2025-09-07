import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Card } from './ui/Card';
import { Slider } from './ui/Slider';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { InclinedPlaneIcon, PlayIcon, PauseIcon, ResetIcon, InfoIcon } from './ui/Icons';

const GRAVITY = 9.81;

const InclinedPlane: React.FC = () => {
  const [angle, setAngle] = useState(30); // degrees
  const [mass, setMass] = useState(5); // kg
  const [friction, setFriction] = useState(0.2); // coefficient of kinetic friction

  const [isRunning, setIsRunning] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationState = useRef({
    position: 0, // meters along the plane
    velocity: 0, // m/s
    time: 0,
    lastUpdateTime: 0,
  });

  const calculations = useMemo(() => {
    const angleRad = (angle * Math.PI) / 180;
    const forceParallel = mass * GRAVITY * Math.sin(angleRad);
    const forceNormal = mass * GRAVITY * Math.cos(angleRad);
    const forceFriction = friction * forceNormal;
    const netForce = forceParallel - forceFriction;
    const acceleration = netForce > 0 ? netForce / mass : 0;
    return { acceleration };
  }, [angle, mass, friction]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const angleRad = (angle * Math.PI) / 180;
    const planeBase = width * 0.8;
    const planeHeight = planeBase * Math.tan(angleRad);
    const planeHypotenuse = Math.sqrt(planeBase*planeBase + planeHeight*planeHeight);

    const startX = (width - planeBase) / 2;
    const startY = height - 40;

    // Draw Plane
    ctx.fillStyle = '#4A5568';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + planeBase, startY);
    ctx.lineTo(startX, startY - planeHeight);
    ctx.closePath();
    ctx.fill();

    // Draw Block
    const pixelScale = planeHypotenuse / 15; // Map 15 meters to hypotenuse length
    const blockPositionPx = simulationState.current.position * pixelScale;
    const blockSize = 15 + mass;
    
    const blockX = startX + blockPositionPx * Math.cos(angleRad);
    const blockY = startY - planeHeight + blockPositionPx * Math.sin(angleRad);

    ctx.save();
    ctx.translate(blockX, blockY);
    ctx.rotate(-angleRad);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-blockSize / 2, -blockSize, blockSize, blockSize);
    ctx.strokeStyle = '#0284c7';
    ctx.strokeRect(-blockSize / 2, -blockSize, blockSize, blockSize);
    ctx.restore();

  }, [angle, mass]);
  
  const resetState = useCallback(() => {
    setIsRunning(false);
    simulationState.current = {
      position: 0,
      velocity: 0,
      time: 0,
      lastUpdateTime: 0,
    };
    // Force a redraw
    setTimeout(draw, 0);
  }, [draw]);


  useEffect(() => {
    draw();
  }, [draw, calculations]);


  useEffect(() => {
    let animationFrameId: number;
    const angleRad = (angle * Math.PI) / 180;
    const planeBase = (canvasRef.current?.width || 600) * 0.8;
    const planeHypotenusePx = planeBase / Math.cos(angleRad);
    const pixelScale = planeHypotenusePx / 15;
    const maxPosition = 15;
    
    const animate = (timestamp: number) => {
      if (simulationState.current.lastUpdateTime > 0) {
        const deltaTime = (timestamp - simulationState.current.lastUpdateTime) / 1000;
        
        simulationState.current.velocity += calculations.acceleration * deltaTime;
        simulationState.current.position += simulationState.current.velocity * deltaTime;
        simulationState.current.time += deltaTime;

        if (simulationState.current.position >= maxPosition) {
            simulationState.current.position = maxPosition;
            setIsRunning(false);
        }
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
  }, [isRunning, calculations.acceleration, draw, angle]);

  useEffect(() => {
    resetState();
  }, [angle, mass, friction, resetState]);
  
  const infoButton = (
    <button onClick={() => setIsInfoModalOpen(true)} className="text-gray-400 hover:text-sky-300 transition-colors" aria-label="Mais informações">
      <InfoIcon />
    </button>
  );

  const ResultCard: React.FC<{ title: string; value: string; unit: string }> = ({ title, value, unit }) => (
    <div className="bg-gray-900/50 p-4 rounded-lg text-center">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-orbitron font-bold text-sky-300">
        {value} <span className="text-base text-sky-500">{unit}</span>
      </p>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        <Card title="Controles do Plano Inclinado" icon={<InclinedPlaneIcon />} className="lg:col-span-1 h-fit" extra={infoButton}>
          <div className="space-y-6">
            <div className="flex space-x-2">
              <Button onClick={() => setIsRunning(!isRunning)} icon={isRunning ? <PauseIcon /> : <PlayIcon />} className="flex-1">
                {isRunning ? 'Pausar' : 'Iniciar'}
              </Button>
              <Button onClick={resetState} icon={<ResetIcon />} variant="secondary" className="flex-1">
                Resetar
              </Button>
            </div>
            <Slider label="Ângulo do Plano (θ)" value={angle} min={5} max={60} step={1} unit="°" onChange={(e) => setAngle(parseFloat(e.target.value))} />
            <Slider label="Massa do Bloco (m)" value={mass} min={1} max={20} step={0.5} unit="kg" onChange={(e) => setMass(parseFloat(e.target.value))} />
            <Slider label="Coeficiente de Atrito (μ)" value={friction} min={0} max={1} step={0.01} unit="" onChange={(e) => setFriction(parseFloat(e.target.value))} />
          </div>
        </Card>

        <div className="lg:col-span-2 flex flex-col gap-8">
          <Card title="Visualização" className="flex-grow">
            <div className="w-full h-80 bg-gray-900/50 rounded-lg">
              <canvas ref={canvasRef} width="600" height="320" className="w-full h-full"/>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ResultCard title="Aceleração" value={calculations.acceleration.toFixed(2)} unit="m/s²" />
              <ResultCard title="Velocidade" value={simulationState.current.velocity.toFixed(2)} unit="m/s" />
              <ResultCard title="Posição" value={simulationState.current.position.toFixed(2)} unit="m" />
          </div>
        </div>
      </div>
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Sobre o Plano Inclinado"
      >
        <p>
          Esta simulação analisa o movimento de um bloco em um <strong>Plano Inclinado</strong>, considerando as forças da gravidade e do atrito. A chave para entender este movimento é decompor a força peso em componentes paralelas e perpendiculares ao plano.
        </p>
        <div className="space-y-3 pt-2">
          <h4 className="font-semibold text-gray-100">Análise das Forças:</h4>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Força Peso (P):</strong> Atua verticalmente para baixo (<code className="bg-gray-900/50 text-sky-300 px-1 py-0.5 rounded-md">P = m * g</code>). Ela é decomposta em:
              <ul className="list-['-_'] list-inside ml-4 mt-1 text-sm">
                  <li>Componente Paralela (<code className="bg-gray-900/50 text-sky-300 px-1 py-0.5 rounded-md">Pₓ = P * sin(θ)</code>): Puxa o bloco para baixo ao longo do plano.</li>
                  <li>Componente Perpendicular (<code className="bg-gray-900/50 text-sky-300 px-1 py-0.5 rounded-md">Pᵧ = P * cos(θ)</code>): Pressiona o bloco contra o plano.</li>
              </ul>
            </li>
            <li>
              <strong>Força Normal (N):</strong> É a força de reação do plano sobre o bloco, perpendicular à superfície. Ela equilibra a componente perpendicular do peso: <code className="bg-gray-900/50 text-sky-300 px-1 py-0.5 rounded-md">N = Pᵧ</code>.
            </li>
             <li>
              <strong>Força de Atrito (Fat):</strong> Opõe-se ao movimento e é calculada por <code className="bg-gray-900/50 text-sky-300 px-1 py-0.5 rounded-md">Fat = μ * N</code>, onde <strong>μ</strong> é o coeficiente de atrito.
            </li>
            <li>
              <strong>Força Resultante e Aceleração:</strong> A força que efetivamente move o bloco é a resultante entre a componente paralela do peso e o atrito (<code className="bg-gray-900/50 text-sky-300 px-1 py-0.5 rounded-md">F_res = Pₓ - Fat</code>). A aceleração é então calculada pela 2ª Lei de Newton: <code className="bg-gray-900/50 text-sky-300 px-1 py-0.5 rounded-md">a = F_res / m</code>.
            </li>
          </ul>
        </div>
      </Modal>
    </>
  );
};

export default InclinedPlane;