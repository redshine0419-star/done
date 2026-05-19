import type { VoiceCommand } from '@/types';

const COMMAND_MAP: { patterns: string[]; cmd: VoiceCommand }[] = [
  { patterns: ['다음', '다음 단계', '넘어가', '넥스트'], cmd: 'next' },
  { patterns: ['멈춰', '정지', '일시정지', '타이머 멈춰', '잠깐'], cmd: 'pause' },
  { patterns: ['완료', '다 됐어', '끝', '완성'], cmd: 'complete' },
];

export function parseVoiceCommand(transcript: string): VoiceCommand | null {
  const lower = transcript.toLowerCase();
  for (const { patterns, cmd } of COMMAND_MAP) {
    if (patterns.some(p => lower.includes(p))) return cmd;
  }
  return null;
}

// Simulates Web Speech API with random mock responses
export function simulateVoiceRecognition(
  onResult: (transcript: string, cmd: VoiceCommand | null) => void,
  onEnd: () => void,
): () => void {
  const phrases = ['다음 단계', '타이머 멈춰', '완료', '다음', '멈춰'];
  const picked = phrases[Math.floor(Math.random() * phrases.length)];

  const timeout = setTimeout(() => {
    const cmd = parseVoiceCommand(picked);
    onResult(picked, cmd);
    onEnd();
  }, 2000);

  return () => clearTimeout(timeout);
}
