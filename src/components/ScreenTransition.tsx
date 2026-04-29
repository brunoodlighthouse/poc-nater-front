import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
  viewKey: string;
  children: ReactNode;
};

export function ScreenTransition({ viewKey, children }: Props) {
  const [visible, setVisible] = useState(true);
  const prevKey = useRef(viewKey);

  useEffect(() => {
    if (prevKey.current !== viewKey) {
      setVisible(false);
      const timer = setTimeout(() => {
        prevKey.current = viewKey;
        setVisible(true);
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [viewKey]);

  return (
    <div
      className={`transition-all duration-200 ease-out ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
      }`}
    >
      {children}
    </div>
  );
}
