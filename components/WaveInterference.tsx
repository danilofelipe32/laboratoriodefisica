import React, { useRef, useEffect, useState } from 'react';
import { Card } from './ui/Card';
import { Slider } from './ui/Slider';
import { Modal } from './ui/Modal';
import { WaveIcon, InfoIcon } from './ui/Icons';

const WaveInterference: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(0);
  const phaseRef = useRef(0);

  const [wavelength, setWavelength] = useState(30);
  const [distance, setDistance] = useState(80);
  const [amplitude, setAmplitude] = useState(128);
  const [waveSpeed, setWaveSpeed] = useState(25);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Effect for handling canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resizeObserver = new ResizeObserver(entries => {
        if (entries && entries.length > 0) {
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        }
    });

    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, []);

  // Effect for drawing and animating the wave pattern
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    let lastTime = 0;

    const animate = (currentTime: number) => {
      const k = (2 * Math.PI) / wavelength;
      const source1 = { x: canvas.width / 4, y: canvas.height / 2 - distance / 2 };
      const source2 = { x: canvas.width / 4, y: canvas.height / 2 + distance / 2 };

      if (lastTime > 0) {
        const deltaTime = (currentTime - lastTime) / 1000; // time in seconds
        phaseRef.current -= (waveSpeed * Math.PI * deltaTime);
      }
      lastTime = currentTime;
      
      for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
          const d1 = Math.sqrt((x - source1.x) ** 2 + (y - source1.y) ** 2);
          const d2 = Math.sqrt((x - source2.x) ** 2 + (y - source2.y) ** 2);
          
          const value = Math.sin(k * d1 + phaseRef.current) + Math.sin(k * d2 + phaseRef.current);
          const brightness = Math.floor(amplitude * (1 + value));

          const index = (y * canvas.width + x) * 4;
          data[index] = brightness;
          data[index + 1] = brightness / 1.5;
          data[index + 2] = brightness / 2;
          data[index + 3] = 255;
        }
      }
      
      ctx.putImageData(imageData, 0, 0);

      // Draw sources
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(source1.x, source1.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(source2.x, source2.y, 5, 0, 2 * Math.PI);
      ctx.fill();

      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };

  }, [wavelength, distance, amplitude, waveSpeed, dimensions]);

  const infoButton = (
    <button onClick={() => setIsInfoModalOpen(true)} className="text-gray-400 hover:text-sky-300 transition-colors" aria-label="Mais informações">
      <InfoIcon />
    </button>
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        <Card title="Controles" icon={<WaveIcon />} className="lg:col-span-1 h-fit" extra={infoButton}>
          <div className="space-y-6">
            <Slider
              label="Comprimento de Onda"
              value={wavelength}
              min={5}
              max={100}
              step={1}
              unit="px"
              onChange={(e) => setWavelength(parseFloat(e.target.value))}
            />
            <Slider
              label="Distância das Fontes"
              value={distance}
              min={10}
              max={200}
              step={2}
              unit="px"
              onChange={(e) => setDistance(parseFloat(e.target.value))}
            />
            <Slider
              label="Amplitude"
              value={amplitude}
              min={50}
              max={128}
              step={1}
              unit=""
              onChange={(e) => setAmplitude(parseFloat(e.target.value))}
            />
            <Slider
              label="Velocidade da Onda"
              value={waveSpeed}
              min={10}
              max={200}
              step={1}
              unit="px/s"
              onChange={(e) => setWaveSpeed(parseFloat(e.target.value))}
            />
          </div>
        </Card>
        <div className="lg:col-span-2 h-[400px] lg:h-full">
          <Card title="Padrão de Interferência" className="h-full flex flex-col">
              <div className="flex-grow w-full h-full rounded-lg overflow-hidden bg-black">
                  <canvas ref={canvasRef} className="w-full h-full" />
              </div>
          </Card>
        </div>
      </div>
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Sobre a Interferência de Ondas"
      >
        <p>
          A <strong>Interferência de Ondas</strong> é um fenômeno que ocorre quando duas ou mais ondas se encontram no mesmo ponto do espaço. O padrão resultante é determinado pela soma das amplitudes individuais das ondas, um conceito conhecido como <strong>Princípio da Superposição</strong>.
        </p>
        <div className="space-y-3 pt-2">
          <h4 className="font-semibold text-gray-100">Tipos de Interferência:</h4>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Interferência Construtiva:</strong> Acontece quando as cristas (ou vales) de ambas as ondas se alinham. A amplitude da onda resultante é a soma das amplitudes individuais, criando áreas de maior intensidade (as regiões mais claras na simulação).
            </li>
            <li>
              <strong>Interferência Destrutiva:</strong> Ocorre quando a crista de uma onda se alinha com o vale de outra. As amplitudes se cancelam, resultando em uma amplitude zero ou muito reduzida, o que cria áreas de intensidade mínima (as regiões escuras).
            </li>
            <li>
              O padrão de franjas claras e escuras que você vê é o resultado direto da alternância entre interferência construtiva e destrutiva, dependendo da diferença de caminho que as ondas percorrem desde cada fonte até um determinado ponto na tela.
            </li>
          </ul>
        </div>
      </Modal>
    </>
  );
};

export default WaveInterference;