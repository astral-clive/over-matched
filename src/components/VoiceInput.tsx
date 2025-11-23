"use client";

import { useState, useEffect, useRef } from "react";
import { HEROES } from "@/data/heroes";

interface VoiceInputProps {
  onHeroesDetected: (heroIds: string[]) => void;
}

export default function VoiceInput({ onHeroesDetected }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const fullTranscriptRef = useRef<string>("");
  const isStartingRef = useRef<boolean>(false);

  // Hero name aliases for better speech recognition
  const heroAliases: Record<string, string[]> = {
    'ana': ['ana', 'anna', 'annah', 'annie', 'anah'],
    'dva': ['dva', 'd.va', 'diva', 'deva', 'd va', 'dee va', 'dava', 'dvia'],
    'genji': ['genji', 'genju', 'gengee', 'gengi', 'genji', 'gency'],
    'hanzo': ['hanzo', 'hanzou', 'hanso', 'honso', 'hanzo', 'henzo'],
    'junkrat': ['junkrat', 'junk rat', 'junk', 'junker', 'junkrate', 'chunk rat'],
    'lucio': ['lucio', 'luchio', 'luccio', 'loosio', 'luccio', 'lucci', 'lucia', 'lucy'],
    'mccree': ['mccree', 'mcree', 'mccrae', 'cassidy', 'cassity', 'cassie', 'macree', 'magree'],
    'mei': ['mei', 'may', 'mey', 'mae'],
    'pharah': ['pharah', 'farah', 'fara', 'phara', 'farrah', 'fair', 'pharaoh'],
    'reaper': ['reaper', 'reeper', 'reepa', 'ripper'],
    'reinhardt': ['reinhardt', 'reinhart', 'rhinehart', 'rinehart', 'rhine', 'rein', 'ryan', 'ryanhart', 'rinehardt', 'reinhard'],
    'roadhog': ['roadhog', 'road hog', 'hog', 'rodhog', 'rode hog'],
    'soldier-76': ['soldier', 'soldier 76', 'soldier seventy six', 'soldier seventy-six', '76', 'seventy six', 'seventy-six', 'soldier seventy', 'soul', 'solder'],
    'symmetra': ['symmetra', 'symmetry', 'sym', 'simetra', 'simitra', 'symmetrica'],
    'torbjorn': ['torbjorn', 'torb', 'torbjörn', 'torbyorn', 'torborn', 'torbjorn', 'turbo', 'torb', 'torby'],
    'tracer': ['tracer', 'traser', 'trace', 'tracey', 'tracy', 'traser'],
    'widowmaker': ['widowmaker', 'widow maker', 'widow', 'widowmake', 'windows', 'wido'],
    'winston': ['winston', 'winsten', 'winstone', 'winsten', 'winston'],
    'zarya': ['zarya', 'zaria', 'zariah', 'zarya', 'zara', 'zoria', 'saria'],
    'zenyatta': ['zenyatta', 'zen', 'zenyata', 'zeniatta', 'zenyattah', 'zenyada', 'zen yatta', 'zenyata'],
    'bastion': ['bastion', 'bashtion', 'bastion', 'bastian', 'sebastian'],
    'brigitte': ['brigitte', 'brigette', 'brigitta', 'brig', 'bridget', 'brigade', 'brigit', 'briget'],
    'doomfist': ['doomfist', 'doom fist', 'doom', 'doomfish', 'doomfest'],
    'orisa': ['orisa', 'orissa', 'aureesa', 'orisha', 'orise', 'orisa'],
    'moira': ['moira', 'moyra', 'moria', 'moura', 'myra', 'moirah'],
    'sombra': ['sombra', 'sombre', 'sambra', 'sombro', 'sombre', 'sombre'],
    'wrecking-ball': ['wrecking ball', 'hammond', 'hammon', 'ball', 'hamman', 'hammon', 'wrecking', 'wreckingball', 'hammond'],
    'ashe': ['ashe', 'ash', 'ashley', 'ashey', 'ashy'],
    'baptiste': ['baptiste', 'baptist', 'bapteest', 'baptiste', 'baptise', 'battiste', 'batist'],
    'sigma': ['sigma', 'sigmar', 'sigma', 'sigmah', 'cigma'],
    'echo': ['echo', 'ekko', 'ecko', 'eco', 'eko'],
    'sojourn': ['sojourn', 'sojourn', 'sojourn', 'soldier', 'so-john', 'sojourn'],
    'junker-queen': ['junker queen', 'junker', 'queen', 'junk queen', 'junker queen', 'junker'],
    'kiriko': ['kiriko', 'kirico', 'kiriko', 'keiko', 'kiri', 'kyrico'],
    'ramattra': ['ramattra', 'ramatra', 'rahmatra', 'rhamatra', 'ramata', 'ramatra'],
    'lifeweaver': ['lifeweaver', 'life weaver', 'weaver', 'life', 'lifeweaver'],
    'illari': ['illari', 'ilari', 'elari', 'ellari', 'hilari', 'hillary'],
    'mauga': ['mauga', 'maga', 'manga', 'mowga', 'mooga', 'mauga'],
    'venture': ['venture', 'venture', 'ventra', 'ventura'],
    'juno': ['juno', 'juneau', 'juno', 'juneau'],
    'mercy': ['mercy', 'merci', 'mersey', 'mercie', 'mercy'],
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isStartingRef.current = false;
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript;
          fullTranscriptRef.current += transcript + ' ';
          setTranscript(fullTranscriptRef.current);
          matchAndSelectHeroes(fullTranscriptRef.current, heroAliases);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      isStartingRef.current = false;
      if (event.error === 'no-speech') {
        return;
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  // Match detected speech to hero names with aliases
  const matchAndSelectHeroes = (text: string, aliases: Record<string, string[]>) => {
    const lowerText = text.toLowerCase();
    const matchedHeroes: string[] = [];

    HEROES.forEach(hero => {
      // Check main hero name and all aliases
      const namesToCheck = aliases[hero.id] || [hero.name.toLowerCase()];
      
      for (const name of namesToCheck) {
        // Use word boundary matching to avoid partial matches
        const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lowerText) && !matchedHeroes.includes(hero.id)) {
          matchedHeroes.push(hero.id);
          break;
        }
      }
    });

    if (matchedHeroes.length > 0) {
      onHeroesDetected(matchedHeroes);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isStartingRef.current) {
      setTranscript("");
      fullTranscriptRef.current = "";
      isStartingRef.current = true;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start recognition:', e);
        isStartingRef.current = false;
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      isStartingRef.current = false;
      try {
        if (isListening) {
          recognitionRef.current.stop();
        }
      } catch (e) {
        console.error('Failed to stop recognition:', e);
      }
      setIsListening(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    startListening();
  };

  const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    stopListening();
  };

  const handleMouseLeave = () => {
    if (isListening) {
      stopListening();
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        className={`p-1.5 rounded-lg transition-all select-none ${
          isListening
            ? "bg-red-500 text-white animate-pulse"
            : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
        }`}
        title={isListening ? "Recording... Release to stop" : "Hold to record"}
      >
        <svg
          className="w-4 h-4 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </button>
      
      {isListening && (
        <div className="text-xs text-red-300 font-medium flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-1 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
          </div>
          Recording...
        </div>
      )}
    </div>
  );
}

