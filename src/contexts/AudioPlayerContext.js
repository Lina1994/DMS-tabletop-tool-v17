import React, { createContext, useState, useRef, useContext, useEffect } from 'react';
import API_BASE_URL from '../apiConfig';

const AudioPlayerContext = createContext();

export const AudioPlayerProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const playSong = (song) => {
    console.log('AudioPlayerContext: playSong called with:', song); // Debug log
    console.log('AudioPlayerContext: currentSong before comparison:', currentSong); // Debug log

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentSong(song);
    if (song && audioRef.current) { // Only attempt to play if a song object is provided
      const fileName = song.filePath.split('\\').pop();
      const audioSrc = `${API_BASE_URL}/music/${fileName}`;
      audioRef.current.src = audioSrc;
      audioRef.current.loop = true; // Set loop to true
      console.log('AudioPlayerContext.js: Attempting to play audio from:', audioSrc); // Added log
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(_ => {
          setIsPlaying(true);
        })
        .catch(error => {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
        });
      } else {
        setIsPlaying(true);
      }
    } else if (!song) { // If song is null, stop playback
      setIsPlaying(false);
    }
  };

  const pauseSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stopSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentSong(null);
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseSong();
    } else {
      if (audioRef.current && currentSong) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(_ => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error("Error playing audio:", error);
            setIsPlaying(false);
          });
        } else {
          setIsPlaying(true);
        }
      }
    }
  };

  const setVolume = (volume) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => setIsPlaying(false);

    if (audio) {
      audio.addEventListener('ended', handleEnded);
    }

    return () => {
      if (audio) {
        audio.removeEventListener('ended', handleEnded);
      }
    };
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        playSong,
        pauseSong,
        stopSong,
        togglePlayPause,
        setVolume,
        audioRef,
      }}
    >
      {children}
      <audio ref={audioRef} /> {/* Add the audio element here */}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => useContext(AudioPlayerContext);
