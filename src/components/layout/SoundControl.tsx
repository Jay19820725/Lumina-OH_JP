import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Music, Leaf, Mountain, Flame, Sparkles, Waves, Repeat, Repeat1, SkipForward } from 'lucide-react';
import { useSoundscape } from '../../store/SoundscapeContext';

const ElementIcon = ({ element, size = 14 }: { element: string, size?: number }) => {
  switch (element) {
    case 'wood': return <Leaf size={size} />;
    case 'fire': return <Flame size={size} />;
    case 'earth': return <Mountain size={size} />;
    case 'metal': return <Sparkles size={size} />;
    case 'water': return <Waves size={size} />;
    default: return <Music size={size} />;
  }
};

export const SoundControl: React.FC = () => {
  const { isPlaying, currentSound, togglePlay, setSound, playbackMode, setPlaybackMode, nextTrack, tracks } = useSoundscape();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-6 md:right-8 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="bg-white/90 backdrop-blur-2xl border border-white/50 p-4 rounded-[2rem] shadow-2xl flex flex-col gap-2 min-w-[240px]"
          >
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink/40">
                Soundscape
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPlaybackMode(playbackMode === 'list' ? 'single' : 'list')}
                  title={playbackMode === 'list' ? 'List Loop' : 'Single Loop'}
                  className="p-2 rounded-full text-ink/40 hover:text-ink transition-colors"
                >
                  {playbackMode === 'list' ? <Repeat size={14} /> : <Repeat1 size={14} />}
                </button>
                <button
                  onClick={nextTrack}
                  title="Next Track"
                  className="p-2 rounded-full text-ink/40 hover:text-ink transition-colors"
                >
                  <SkipForward size={14} />
                </button>
                <button 
                  onClick={togglePlay}
                  className={`p-2 rounded-full transition-colors ${isPlaying ? 'text-ink' : 'text-ink/30'}`}
                >
                  {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {tracks.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => {
                    setSound(sound.id);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    currentSound?.id === sound.id 
                      ? 'bg-ink text-white shadow-md' 
                      : 'hover:bg-ink/5 text-ink/60 hover:text-ink'
                  }`}
                >
                  <ElementIcon element={sound.element} />
                  <span className="text-xs tracking-wider font-light truncate max-w-[140px]">{sound.name}</span>
                  {currentSound?.id === sound.id && isPlaying && (
                    <motion.div 
                      animate={{ scaleY: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                      className="ml-auto flex gap-0.5 items-center h-3"
                    >
                      <div className="w-0.5 h-1.5 bg-white/60 rounded-full" />
                      <div className="w-0.5 h-2.5 bg-white/60 rounded-full" />
                      <div className="w-0.5 h-1.5 bg-white/60 rounded-full" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 flex items-center justify-center rounded-full border transition-all duration-500 ${
          isOpen 
            ? 'bg-ink text-white border-ink shadow-xl' 
            : isPlaying 
              ? 'bg-white/60 border-white/80 text-ink/80 shadow-lg' 
              : 'bg-white/30 border-white/40 text-ink/30 hover:text-ink/60 shadow-sm'
        } backdrop-blur-md`}
      >
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              <Music size={18} />
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-ink/10 rounded-full -z-10"
              />
            </motion.div>
          ) : (
            <motion.div
              key="muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Music size={18} className="opacity-50" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
