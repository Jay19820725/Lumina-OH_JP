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
    id: 'fire-tea',
    name: 'Little Ember',
    element: 'fire',
    url: 'https://firebasestorage.googleapis.com/v0/b/lumina-oh-jp.firebasestorage.app/o/audio%2FLittle%20Ember%20Tea%20Time%EF%BC%88%E7%81%AB%EF%BC%89%20(1).mp3?alt=media&token=6512316f-3129-4d8a-bde0-53014d00d950'
  },
  {
    id: 'earth-tea',
    name: 'Little Mountain Garden',
    element: 'earth',
    url: 'https://firebasestorage.googleapis.com/v0/b/lumina-oh-jp.firebasestorage.app/o/audio%2FLittle%20Mountain%20Garden%20Tea%20Time%EF%BC%88%E5%9C%9F%EF%BC%89%20(1).mp3?alt=media&token=dc38d876-3867-4694-87b3-a499c62bc97f'
  },
  {
    id: 'metal-tea',
    name: 'Little Silver Bell',
    element: 'metal',
    url: 'https://firebasestorage.googleapis.com/v0/b/lumina-oh-jp.firebasestorage.app/o/audio%2FLittle%20Silver%20Bell%20Tea%20Time%EF%BC%88%E9%87%91%EF%BC%89%20(1).mp3?alt=media&token=4666bbd6-021b-46c5-a8a9-7d0f3077e756'
  },
  {
    id: 'water-tea',
    name: 'Little River Breeze',
    element: 'water',
    url: 'https://firebasestorage.googleapis.com/v0/b/lumina-oh-jp.firebasestorage.app/o/audio%2FLittle%20River%20Breeze%20Tea%20Time%EF%BC%88%E6%B0%B4%EF%BC%89%20(1).mp3?alt=media&token=928fe51c-0b8d-4c91-ad9b-be5b46767f05'
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
