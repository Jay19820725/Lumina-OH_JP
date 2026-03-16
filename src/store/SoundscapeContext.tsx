import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface Soundscape {
  id: string;
  name: string;
  element: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  url: string;
}

export type PlaybackMode = 'list' | 'single';

interface SoundscapeContextType {
  isPlaying: boolean;
  currentSound: Soundscape | null;
  volume: number;
  playbackMode: PlaybackMode;
  tracks: Soundscape[];
  togglePlay: () => void;
  setSound: (id: string) => void;
  setVolume: (volume: number) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  nextTrack: () => void;
}

const SoundscapeContext = createContext<SoundscapeContextType | undefined>(undefined);

export const SoundscapeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSound, setCurrentSound] = useState<Soundscape | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('list');
  const [tracks, setTracks] = useState<Soundscape[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Fetch tracks from API
    const fetchTracks = async () => {
      try {
        const response = await fetch('/api/music');
        if (response.ok) {
          const data = await response.json();
          setTracks(data);
        }
      } catch (err) {
        console.error("Failed to fetch music tracks:", err);
      }
    };
    fetchTracks();
  }, []);

  useEffect(() => {
    audioRef.current = new Audio();
    
    const handleEnded = () => {
      if (playbackMode === 'single') {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(err => console.error("Audio play failed:", err));
        }
      } else {
        nextTrack();
      }
    };

    audioRef.current.addEventListener('ended', handleEnded);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [playbackMode, tracks, currentSound]);

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

  const nextTrack = () => {
    if (tracks.length === 0) return;
    
    const currentIndex = currentSound ? tracks.findIndex(t => t.id === currentSound.id) : -1;
    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentSound(tracks[nextIndex]);
    if (!isPlaying) setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!currentSound && tracks.length > 0) {
        setCurrentSound(tracks[0]);
      }
      audioRef.current.play().catch(err => console.error("Audio play failed:", err));
      setIsPlaying(true);
    }
  };

  const setSound = (id: string) => {
    const sound = tracks.find(s => s.id === id);
    if (sound) {
      setCurrentSound(sound);
      if (!isPlaying) setIsPlaying(true);
    }
  };

  return (
    <SoundscapeContext.Provider value={{ 
      isPlaying, 
      currentSound, 
      volume, 
      playbackMode, 
      tracks,
      togglePlay, 
      setSound, 
      setVolume, 
      setPlaybackMode,
      nextTrack
    }}>
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
