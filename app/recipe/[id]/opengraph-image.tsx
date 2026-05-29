import { ImageResponse } from 'next/og';
import { mockRecipes } from '@/data/mockRecipes';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image({ params }: { params: { id: string } }) {
  const recipe = mockRecipes.find(r => r.id === params.id);
  const title = recipe?.title ?? '레시피';
  const thumbnail = recipe?.thumbnail ?? '🍳';
  const isCombo = recipe?.isCombo ?? false;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #FEF0E8 0%, #F5C6A8 100%)',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        <div style={{ fontSize: 140, lineHeight: 1, marginBottom: 32 }}>{thumbnail}</div>
        <div style={{ fontSize: 64, fontWeight: 900, color: '#1A0A00', textAlign: 'center', lineHeight: 1.2, maxWidth: '900px' }}>
          {title}
        </div>
        {isCombo && (
          <div style={{
            marginTop: 24,
            fontSize: 28,
            fontWeight: 700,
            color: '#6B3FD4',
            background: '#F0ECFF',
            padding: '8px 24px',
            borderRadius: '100px',
          }}>
            ⚡ 2구 병렬 코스
          </div>
        )}
        <div style={{
          position: 'absolute',
          bottom: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: '#C94B2A',
          fontSize: 32,
          fontWeight: 700,
        }}>
          🍽 플레이버 싱크
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
