
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Slider } from './ui/Slider';
import { Modal } from './ui/Modal';
import { AtomIcon, PlayIcon, PauseIcon, ResetIcon, InfoIcon } from './ui/Icons';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  charge: number; // -1 for electron, 1 for proton, 0 for neutron
  color: string;
}

const G = 0.5; // Gravitational constant (scaled for simulation)
const k = 10;   // Coulomb's constant (scaled for simulation)

const ParticleSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const animationFrameId = useRef<number>(0);
  
  const [gravity, setGravity] = useState(0.1);
  const [electrostatics, setElectrostatics] = useState(1);

  const resetSimulation = useCallback(() => {
    setIsRunning(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newParticles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
        const charge = Math.floor(Math.random() * 3) - 1;
        let color, mass, radius;
        switch (charge) {
            case 1: color = '#38bdf8'; mass = 2; radius = 3; break; // Proton-like
            case -1: color = '#f43f5e'; mass = 1; radius = 2; break; // Electron-like
            default: color = '#a1a1aa'; mass = 2.1; radius = 3; break; // Neutron-like
        }
      newParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius,
        mass,
        charge,
        color,
      });
    }
    setParticles(newParticles);
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if(parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
    resetSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
  }, [particles]);

  const gameLoop = useCallback(() => {
    setParticles(prevParticles => {
      const newParticles = JSON.parse(JSON.stringify(prevParticles)) as Particle[];
      const canvas = canvasRef.current;
      if (!canvas) return prevParticles;

      for (let i = 0; i < newParticles.length; i++) {
        let fx = 0;
        let fy = 0;

        for (let j = 0; j < newParticles.length; j++) {
          if (i === j) continue;

          const dx = newParticles[j].x - newParticles[i].x;
          const dy = newParticles[j].y - newParticles[i].y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);

          if (dist > 2) { // Avoid division by zero and extreme forces
            const forceGrav = (G * gravity * newParticles[i].mass * newParticles[j].mass) / distSq;
            fx += forceGrav * (dx / dist);
            fy += forceGrav * (dy / dist);

            const forceElec = (k * electrostatics * newParticles[i].charge * newParticles[j].charge) / distSq;
            fx -= forceElec * (dx / dist); // Repulsive for same charges
            fy -= forceElec * (dy / dist);
          }
        }

        const ax = fx / newParticles[i].mass;
        const ay = fy / newParticles[i].mass;

        newParticles[i].vx += ax;
        newParticles[i].vy += ay;
        newParticles[i].x += newParticles[i].vx;
        newParticles[i].y += newParticles[i].vy;

        // Wall collisions
        if (newParticles[i].x < 0 || newParticles[i].x > canvas.width) newParticles[i].vx *= -0.8;
        if (newParticles[i].y < 0 || newParticles[i].y > canvas.height) newParticles[i].vy *= -0.8;
        newParticles[i].x = Math.max(0, Math.min(canvas.width, newParticles[i].x));
        newParticles[i].y = Math.max(0, Math.min(canvas.height, newParticles[i].y));
      }

      return newParticles;
    });

    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [gravity, electrostatics]);

  useEffect(() => {
    if (isRunning) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    } else {
      cancelAnimationFrame(animationFrameId.current);
    }

    return () => cancelAnimationFrame(animationFrameId.current);
  }, [isRunning, gameLoop]);

  const infoButton = (
    <button onClick={() => setIsInfoModalOpen(true)} className="text-gray-400 hover:text-sky-300 transition-colors" aria-label="Mais informações">
      <InfoIcon />
    </button>
  );

  return (
    <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <Card title="Controles" icon={<AtomIcon />} className="lg:col-span-1 h-fit" extra={infoButton}>
                <div className="space-y-6">
                    <div className="flex space-x-2">
                        <Button onClick={() => setIsRunning(!isRunning)} icon={isRunning ? <PauseIcon /> : <PlayIcon />} className="flex-1">
                            {isRunning ? 'Pausar' : 'Iniciar'}
                        </Button>
                        <Button onClick={resetSimulation} icon={<ResetIcon />} variant="secondary" className="flex-1">
                            Resetar
                        </Button>
                    </div>
                    <Slider label="Força da Gravidade" value={gravity} min={0} max={1} step={0.01} onChange={e => setGravity(parseFloat(e.target.value))} />
                    <Slider label="Força Eletrostática" value={electrostatics} min={0} max={5} step={0.1} onChange={e => setElectrostatics(parseFloat(e.target.value))} />
                    <div className="pt-4 border-t border-gray-700/60">
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Legenda</h3>
                        <div className="flex items-center space-x-4"><div className="w-4 h-4 rounded-full bg-sky-500"></div><span className="text-sm text-gray-300">Carga Positiva</span></div>
                        <div className="flex items-center space-x-4"><div className="w-4 h-4 rounded-full bg-rose-500"></div><span className="text-sm text-gray-300">Carga Negativa</span></div>
                        <div className="flex items-center space-x-4"><div className="w-4 h-4 rounded-full bg-zinc-500"></div><span className="text-sm text-gray-300">Neutra</span></div>
                    </div>
                </div>
            </Card>
            <div className="lg:col-span-2 h-[400px] lg:h-full">
                <Card title="Simulação" className="h-full flex flex-col">
                    <div className="flex-grow w-full h-full rounded-lg overflow-hidden bg-gray-900/70">
                        <canvas ref={canvasRef} className="w-full h-full" />
                    </div>
                </Card>
            </div>
        </div>
        <Modal
            isOpen={isInfoModalOpen}
            onClose={() => setIsInfoModalOpen(false)}
            title="Sobre o Simulador de Partículas"
        >
            <p>
            Esta simulação demonstra a interação de múltiplas partículas sob a influência de duas forças fundamentais: <strong>Gravidade</strong> e <strong>Eletrostática</strong>. O movimento de cada partícula é calculado a cada passo com base na força resultante exercida por todas as outras partículas.
            </p>
            <div className="space-y-3 pt-2">
            <h4 className="font-semibold text-gray-100">Forças em Ação:</h4>
            <ul className="list-disc list-inside space-y-2">
                <li>
                <strong>Gravidade (Atração):</strong> Baseada na Lei da Gravitação Universal de Newton. É uma força sempre atrativa, proporcional ao produto das massas e inversamente proporcional ao quadrado da distância.
                <ul className="list-['-_'] list-inside ml-4 mt-1 text-sm">
                    <li>Fórmula: <code className="bg-gray-900/50 text-sky-300 px-1 py-0.5 rounded-md">F = G * (m₁ * m₂) / r²</code></li>
                </ul>
                </li>
                <li>
                <strong>Força Eletrostática (Atração/Repulsão):</strong> Baseada na Lei de Coulomb. Pode ser atrativa (cargas opostas) ou repulsiva (cargas iguais). É proporcional ao produto das cargas e inversamente proporcional ao quadrado da distância.
                <ul className="list-['-_'] list-inside ml-4 mt-1 text-sm">
                    <li>Fórmula: <code className="bg-gray-900/50 text-sky-300 px-1 py-0.5 rounded-md">F = k * (q₁ * q₂) / r²</code></li>
                </ul>
                </li>
                <li>
                <strong>Cálculo do Movimento:</strong> A força resultante em cada partícula é a soma vetorial de todas as forças gravitacionais e eletrostáticas. A aceleração é então encontrada usando a Segunda Lei de Newton (<code className="bg-gray-900/50 text-sky-300 px-1 py-0.5 rounded-md">a = F/m</code>), permitindo atualizar a velocidade e a posição da partícula.
                </li>
            </ul>
            </div>
        </Modal>
    </>
  );
};

export default ParticleSimulator;