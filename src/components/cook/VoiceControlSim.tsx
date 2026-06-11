'use client';
import { useState } from 'react';
import type { VoiceCommand } from '@/types';
import { simulateVoiceRecognition } from '@/utils/speechSim';
import { t } from '@/i18n';

interface Props {
  onCommand: (cmd: VoiceCommand) => void;
}

export function VoiceControlSim({ onCommand }: Props) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  function handleMic() {
    if (listening) return;
    setListening(true);
    setTranscript(t.cook.voiceListening);
    simulateVoiceRecognition(
      (text, cmd) => {
        setTranscript(`"${text}"`);
        if (cmd) onCommand(cmd);
      },
      () => setListening(false),
    );
  }

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
      <button
        onClick={handleMic}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl touch-manipulation transition-all ${
          listening ? 'bg-red-100 animate-pulse scale-110' : 'bg-gray-100 hover:bg-orange-50'
        }`}
      >
        🎤
      </button>
      <div className="flex-1">
        <p className="text-xs font-bold text-gray-600">{t.cook.voiceControl}</p>
        <p className="text-xs text-gray-400 mt-0.5">{transcript || t.cook.voiceHint}</p>
      </div>
    </div>
  );
}
