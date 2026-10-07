import React, { useState, useEffect } from 'react';
import { Mic, MicOff, X, Volume2, Sparkles, MessageSquare } from 'lucide-react';
import { generateGeminiResponse } from '../services/geminiService';

interface LiveVoiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptReceived: (userText: string, modelText: string) => void;
}

export const LiveVoiceOverlay: React.FC<LiveVoiceOverlayProps> = ({
  isOpen,
  onClose,
  onTranscriptReceived
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [statusText, setStatusText] = useState('Tap mic to start Gemini Live voice');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) {
      if (recognition) {
        try { recognition.stop(); } catch (e) {}
      }
      setIsListening(false);
      window.speechSynthesis?.cancel();
      return;
    }

    // Set up Web Speech API if supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setStatusText('Listening to your voice...');
      };

      rec.onresult = (e: any) => {
        const current = e.results[0][0].transcript;
        setTranscript(current);
      };

      rec.onend = async () => {
        setIsListening(false);
        if (transcript.trim()) {
          setStatusText('Gemini is thinking...');
          try {
            const result = await generateGeminiResponse({
              model: 'gemini-2.5-flash',
              prompt: transcript,
              systemInstruction: 'Respond conversationally and concisely for low-latency live spoken conversation. Keep it under 2-3 sentences.',
            });

            setStatusText('Gemini speaking...');
            if ('speechSynthesis' in window) {
              const utter = new SpeechSynthesisUtterance(result.text);
              utter.onend = () => {
                setStatusText('Tap mic to speak again');
              };
              window.speechSynthesis.speak(utter);
            }

            onTranscriptReceived(transcript, result.text);
          } catch (err: any) {
            setStatusText('Error responding. Please try again.');
          }
        } else {
          setStatusText('No speech detected. Tap mic to try again.');
        }
      };

      setRecognition(rec);
    } else {
      setStatusText('Speech recognition not supported in this browser. You can type queries.');
    }
  }, [isOpen, transcript]);

  const toggleMic = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
    } else {
      setTranscript('');
      try {
        recognition.start();
      } catch (e) {
        recognition.stop();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0d0d0e]/90 backdrop-blur-xl z-50 flex flex-col items-center justify-between p-6 select-none animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="w-full max-w-xl flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-bold text-white tracking-wide">Gemini Live Native Audio</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Center Voice Orb Visualizer */}
      <div className="flex flex-col items-center justify-center space-y-8 my-auto">
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Glow */}
          <div
            className={`w-44 h-44 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 blur-2xl opacity-60 transition duration-500 ${
              isListening ? 'scale-125 animate-pulse' : 'scale-100'
            }`}
          />

          {/* Core Interactive Sphere */}
          <div
            onClick={toggleMic}
            className={`relative w-36 h-36 rounded-full bg-gradient-to-tr from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-2xl cursor-pointer hover:scale-105 active:scale-95 transition duration-300 ring-4 ring-white/20`}
          >
            {isListening ? (
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-8 bg-white rounded-full animate-bounce" />
                <span className="w-1.5 h-12 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-6 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            ) : (
              <Mic className="w-12 h-12 text-white stroke-[1.5]" />
            )}
          </div>
        </div>

        {/* Live Status text */}
        <div className="text-center max-w-md space-y-2">
          <p className="text-sm font-semibold text-neutral-200 tracking-wide">{statusText}</p>
          {transcript && (
            <div className="bg-[#1e1f20] px-4 py-2.5 rounded-2xl border border-[#3c4043] text-xs text-neutral-300 italic">
              "{transcript}"
            </div>
          )}
        </div>
      </div>

      {/* Bottom info */}
      <div className="text-xs text-neutral-500 pb-2">
        Ultra-low latency spoken voice mode • Powered by Gemini 2.5
      </div>
    </div>
  );
};
