import React, { useState } from 'react';
import {
  Zap, Rocket, Sparkles, Flame, Layers, Target,
  Shield, Cpu, FolderKanban, Code, Lightbulb, Compass,
  Box, Globe, Palette, Atom, Terminal, Stars
} from 'lucide-react';

const SYMBOL_PALETTES = [
  {
    Icon: Sparkles,
    bg: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-indigo-500/20',
    border: 'border-indigo-200/50',
    color: 'text-white'
  },
  {
    Icon: Rocket,
    bg: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white shadow-blue-500/20',
    border: 'border-blue-200/50',
    color: 'text-white'
  },
  {
    Icon: Zap,
    bg: 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-orange-500/20',
    border: 'border-amber-200/50',
    color: 'text-white'
  },
  {
    Icon: Layers,
    bg: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 text-white shadow-emerald-500/20',
    border: 'border-emerald-200/50',
    color: 'text-white'
  },
  {
    Icon: Flame,
    bg: 'bg-gradient-to-br from-rose-500 via-red-500 to-amber-500 text-white shadow-rose-500/20',
    border: 'border-rose-200/50',
    color: 'text-white'
  },
  {
    Icon: Target,
    bg: 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-800 text-white shadow-purple-500/20',
    border: 'border-purple-200/50',
    color: 'text-white'
  },
  {
    Icon: Shield,
    bg: 'bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 text-white shadow-cyan-500/20',
    border: 'border-cyan-200/50',
    color: 'text-white'
  },
  {
    Icon: Cpu,
    bg: 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white shadow-slate-700/20',
    border: 'border-slate-400/50',
    color: 'text-white'
  },
  {
    Icon: Palette,
    bg: 'bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 text-white shadow-pink-500/20',
    border: 'border-pink-200/50',
    color: 'text-white'
  },
  {
    Icon: Lightbulb,
    bg: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 text-white shadow-yellow-500/20',
    border: 'border-yellow-200/50',
    color: 'text-white'
  },
  {
    Icon: Code,
    bg: 'bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-white shadow-sky-500/20',
    border: 'border-sky-200/50',
    color: 'text-white'
  },
  {
    Icon: Compass,
    bg: 'bg-gradient-to-br from-teal-500 via-emerald-600 to-green-700 text-white shadow-teal-500/20',
    border: 'border-teal-200/50',
    color: 'text-white'
  },
];

const SIZE_MAP = {
  xs: { container: 'w-5 h-5 rounded-md', icon: 'w-3 h-3', text: 'text-[9px]' },
  sm: { container: 'w-7 h-7 rounded-lg', icon: 'w-3.5 h-3.5', text: 'text-xs font-bold' },
  md: { container: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5', text: 'text-sm font-bold' },
  lg: { container: 'w-14 h-14 rounded-2xl', icon: 'w-7 h-7', text: 'text-xl font-bold' },
  xl: { container: 'w-16 h-16 rounded-2xl', icon: 'w-8 h-8', text: 'text-2xl font-black' },
};

export const getWorkspaceSymbolConfig = (name = '', id = '') => {
  const seed = (name + (id || '')).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return SYMBOL_PALETTES[Math.abs(seed) % SYMBOL_PALETTES.length];
};

const WorkspaceLogo = ({
  workspace = null,
  name: propName = '',
  logoUrl: propLogoUrl = '',
  id: propId = '',
  size = 'md',
  className = '',
  imgClassName = '',
  symbolClassName = ''
} = {}) => {
  const [imageError, setImageError] = useState(false);

  const name = workspace?.name || propName || 'Workspace';
  const logoUrl = workspace?.logoUrl || propLogoUrl || '';
  const id = workspace?.id || workspace?._id || propId || '';

  const sizeStyles = SIZE_MAP[size] || SIZE_MAP.md;
  const symbol = getWorkspaceSymbolConfig(name, id);
  const { Icon, bg, color } = symbol;

  const hasValidLogo = !!logoUrl && !imageError;

  if (hasValidLogo) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden flex items-center justify-center bg-white border border-slate-200/80 shadow-xs ${sizeStyles.container} ${className}`}
      >
        <img
          src={logoUrl}
          alt={name}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover select-none ${imgClassName}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center shadow-sm select-none ${sizeStyles.container} ${bg} ${className}`}
      title={name}
    >
      <Icon className={`${sizeStyles.icon} ${color} ${symbolClassName} drop-shadow-xs`} />
    </div>
  );
};

export default WorkspaceLogo;
