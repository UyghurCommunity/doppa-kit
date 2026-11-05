import { useEffect, useRef } from 'react';
import { createDoppa } from '@uyghurcommunity/doppa';

export function Doppa({ palette = 'badam' }) {
  const canvas = useRef(null);
  const instance = useRef(null);
  useEffect(() => {
    instance.current = createDoppa(canvas.current, { palette });
    return () => { instance.current.destroy(); instance.current = null; };
  }, []);
  useEffect(() => { instance.current?.setPalette(palette); }, [palette]);
  return <canvas ref={canvas} style={{ width: '100%', height: 420 }} aria-label="Interactive doppa-inspired embroidery" />;
}
