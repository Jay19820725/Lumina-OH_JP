import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface Soundscape {
  id: string;
  name: string;
  element: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  url: string;
}

export const SOUNDSCAPES: Soundscape[] = [
  {
    id: 'wood-tea',
    name: 'Little Forest Spirit',
    element: 'wood',
    url: 'https://firebasestorage.googleapis.com/v0/b/lumina-oh-jp.firebasestorage.app/o/audio%2FLittle%20Forest%20Spirit%20Tea%20Time%EF%BC%88%E6%9C%A8%EF%BC%89%20(1).mp3?alt=media&token=2fa73b22-abdb-481b-b9ac-82f7b075fce1'
  },
  {
    id: 'earth-tea',
    name: 'Little Mountain Garden',
    element: 'earth',
    url: 'https://firebasestorage.googleapis.com/v0/b/lumina-oh-jp.firebasestorage.app/o/audio%2FLittle%20Mountain%20Garden%20Tea%20Time%EF%BC%88%E5%9C%9F%EF%BC%89%20(1).mp3?alt=media&token=dc38d876-3867-4694-87b3-a499c62bc97f'
  }
];

interface SoundscapeContextType {
  isPlaying: boolean;
  currentSound: Soundscape | null;
  volume: number;
  togglePlay: () => void;
  setSound: (id: string) => void;
  setVolume: (volume: number) => void;
}

const SoundscapeContext = createContext<SoundscapeContextType | undefined>(undefined);

export const SoundscapeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSound, setCurrentSound] = useState<Soundscape | null>(null);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) return;

    if (currentSound) {
      const wasPlaying = isPlaying;
      audioRef.current.src = currentSound.url;
      if (wasPlaying) {
        audioRef.current.play().catch(err => console.error("Audio play failed:", err));
      }
    } else {
      audioRef.current.pause();
    }
  }, [currentSound]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!currentSound && SOUNDSCAPES.length > 0) {
        setCurrentSound(SOUNDSCAPES[0]);
      }
      audioRef.current.play().catch(err => console.error("Audio play failed:", err));
      setIsPlaying(true);
    }
  };

  const setSound = (id: string) => {
    const sound = SOUNDSCAPES.find(s => s.id === id);
    if (sound) {
      setCurrentSound(sound);
      if (!isPlaying) setIsPlaying(true);
    }
  };

  return (
    <SoundscapeContext.Provider value={{ isPlaying, currentSound, volume, togglePlay, setSound, setVolume }}>
      {children}
    </SoundscapeContext.Provider>
  );
};

export const useSoundscape = () => {
  const context = useContext(SoundscapeContext);
  if (context === undefined) {
    throw new Error('useSoundscape must be used within a SoundscapeProvider');
  }
  return context;
};
