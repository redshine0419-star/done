'use client';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import { LogIn, LogOut, User } from 'lucide-react';

interface Props {
  compact?: boolean;
}

export function LoginButton({ compact = false }: Props) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="w-8 h-8 rounded-full animate-pulse"
           style={{ background: 'var(--border)' }} />
    );
  }

  if (session?.user) {
    return (
      <button
        onClick={() => signOut()}
        className="flex items-center gap-2 touch-manipulation"
        title="로그아웃"
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name ?? ''}
            width={28}
            height={28}
            className="rounded-full shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
               style={{ background: 'var(--brand)' }}>
            <User size={14} color="white" />
          </div>
        )}
        {!compact && (
          <span className="text-[13px] font-semibold truncate max-w-[100px]"
                style={{ color: 'var(--text-2)' }}>
            {session.user.name?.split(' ')[0]}
          </span>
        )}
        {!compact && <LogOut size={14} color="var(--text-3)" />}
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="flex items-center gap-1.5 touch-manipulation"
    >
      {compact ? (
        <div className="w-7 h-7 rounded-full flex items-center justify-center"
             style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <LogIn size={14} color="var(--text-3)" />
        </div>
      ) : (
        <>
          <LogIn size={14} color="var(--text-3)" />
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>
            Google 로그인
          </span>
        </>
      )}
    </button>
  );
}
