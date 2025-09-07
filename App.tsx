import React, { useState, useCallback } from 'react';
import { LabTool } from './types';
import ProjectileMotion from './components/ProjectileMotion';
import ParticleSimulator from './components/ParticleSimulator';
import WaveInterference from './components/WaveInterference';
import MRU from './components/MRU';
import MRUV from './components/MRUV';
import SimplePendulum from './components/SimplePendulum';
import InclinedPlane from './components/InclinedPlane';
import { AtomIcon, CannonIcon, WaveIcon, MruIcon, MruvIcon, PendulumIcon, InclinedPlaneIcon } from './components/ui/Icons';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<LabTool>(LabTool.ProjectileMotion);

  const renderActiveTool = useCallback(() => {
    switch (activeTool) {
      case LabTool.ProjectileMotion:
        return <ProjectileMotion />;
      case LabTool.MRU:
        return <MRU />;
      case LabTool.MRUV:
        return <MRUV />;
      case LabTool.SimplePendulum:
        return <SimplePendulum />;
      case LabTool.InclinedPlane:
        return <InclinedPlane />;
      case LabTool.ParticleSimulator:
        return <ParticleSimulator />;
      case LabTool.WaveInterference:
        return <WaveInterference />;
      default:
        return <div className="text-center text-gray-400">Selecione uma ferramenta para começar</div>;
    }
  }, [activeTool]);

  const NavItem: React.FC<{ tool: LabTool; label: string; icon: React.ReactNode }> = ({ tool, label, icon }) => (
    <button
      onClick={() => setActiveTool(tool)}
      className={`flex items-center w-full px-4 py-3 text-left transition-all duration-200 ease-in-out rounded-lg ${
        activeTool === tool
          ? 'bg-sky-500/20 text-sky-300 shadow-lg'
          : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
      }`}
    >
      {icon}
      <span className="ml-4 font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row font-sans">
      <div 
        className="absolute inset-0 bg-fixed bg-no-repeat bg-cover" 
        style={{backgroundImage: "url('https://picsum.photos/seed/physicslab/1920/1080')", filter: 'blur(8px) brightness(0.4)'}}
      ></div>
      <aside className="relative w-full md:w-64 bg-gray-900/70 backdrop-blur-md border-r border-gray-700/50 p-4 shrink-0">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-sky-500/20 rounded-full flex items-center justify-center border-2 border-sky-400/50 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-sky-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <ellipse cx="12" cy="12" rx="10" ry="4.5" />
              <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)" />
              <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(120 12 12)" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-xl font-bold font-orbitron text-gray-100">Laboratório de Física</h1>
          <p className="text-xs text-gray-400">v2.5 Flash</p>
        </div>
        <nav className="space-y-2">
          <NavItem tool={LabTool.ProjectileMotion} label="Movimento de Projétil" icon={<CannonIcon />} />
          <NavItem tool={LabTool.MRU} label="MRU" icon={<MruIcon />} />
          <NavItem tool={LabTool.MRUV} label="MRUV" icon={<MruvIcon />} />
          <NavItem tool={LabTool.SimplePendulum} label="Pêndulo Simples" icon={<PendulumIcon />} />
          <NavItem tool={LabTool.InclinedPlane} label="Plano Inclinado" icon={<InclinedPlaneIcon />} />
          <NavItem tool={LabTool.ParticleSimulator} label="Simulador de Partículas" icon={<AtomIcon />} />
          <NavItem tool={LabTool.WaveInterference} label="Interferência de Ondas" icon={<WaveIcon />} />
        </nav>
      </aside>

      <main className="relative flex-1 p-4 md:p-8 overflow-auto">
        {renderActiveTool()}
      </main>
    </div>
  );
};

export default App;