import { useMemo } from 'react';

const SUPPORTED_EFFECTS = new Set([
  'none',
  'leaves',
  'particles',
  'stars',
  'snow',
  'petals',
  'clouds',
  'birds',
  'sparkles',
]);

const EFFECT_LIMITS = {
  birds: { max: 7, min: 3 },
  clouds: { max: 6, min: 3 },
  leaves: { max: 30, min: 8 },
  particles: { max: 36, min: 10 },
  petals: { max: 28, min: 8 },
  snow: { max: 36, min: 10 },
  sparkles: { max: 28, min: 8 },
  stars: { max: 10, min: 4 },
};

/**
 * Chuẩn hóa kiểu hiệu ứng lấy từ env để chỉ render các biến thể đã hỗ trợ.
 */
function normalizeEffect(effectName) {
  const normalizedEffect = String(effectName || 'leaves').trim().toLowerCase();
  return SUPPORTED_EFFECTS.has(normalizedEffect) ? normalizedEffect : 'leaves';
}

/**
 * Ràng buộc giá trị số để tránh env sai làm hiệu ứng quá nặng hoặc quá nhỏ.
 */
function clamp(value, minValue, maxValue) {
  return Math.min(maxValue, Math.max(minValue, value));
}

/**
 * Tạo số giả ngẫu nhiên theo index để hiệu ứng ổn định giữa các lần render.
 */
function seededValue(index, seed, minValue, maxValue) {
  const rawValue = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  const fraction = rawValue - Math.floor(rawValue);
  return minValue + fraction * (maxValue - minValue);
}

/**
 * Sinh cấu hình vị trí và chuyển động cho từng phần tử hiệu ứng.
 */
function createEffectItems(effect, itemCount, speed, scale, opacity) {
  return Array.from({ length: itemCount }, (_, index) => {
    const isFloatingEffect = effect === 'clouds' || effect === 'birds';
    const isTwinkleEffect = effect === 'sparkles';
    const isStarEffect = effect === 'stars';
    const isParticleEffect = effect === 'particles';
    const left = seededValue(index, 1, isFloatingEffect ? -12 : -4, isFloatingEffect ? 92 : 104);
    const top = seededValue(
      index,
      2,
      isFloatingEffect || isTwinkleEffect || isParticleEffect ? 4 : -16,
      isFloatingEffect ? 64 : isTwinkleEffect || isParticleEffect ? 92 : 18,
    );
    const sizeBase = isStarEffect
      ? seededValue(index, 3, 80, 160)
      : effect === 'clouds'
        ? seededValue(index, 3, 90, 160)
        : effect === 'birds'
          ? seededValue(index, 3, 18, 34)
          : isTwinkleEffect
            ? seededValue(index, 3, 10, 26)
            : seededValue(index, 3, 14, 30);
    const durationBase = effect === 'clouds'
      ? seededValue(index, 4, 18, 34)
      : effect === 'birds'
        ? seededValue(index, 4, 14, 22)
        : isTwinkleEffect
          ? seededValue(index, 4, 2.2, 4.6)
          : isParticleEffect
            ? seededValue(index, 4, 8, 14)
            : isStarEffect
              ? seededValue(index, 4, 5.5, 8.5)
              : seededValue(index, 4, 9, 16);
    const drift = effect === 'clouds'
      ? seededValue(index, 5, 180, 320)
      : effect === 'birds'
        ? seededValue(index, 5, 220, 360)
        : isStarEffect
          ? seededValue(index, 5, 260, 420)
          : isParticleEffect
            ? seededValue(index, 5, -70, 70)
            : seededValue(index, 5, -90, 90);
    const rotation = seededValue(index, 6, -32, 32);
    const delay = seededValue(index, 7, -18, 1.4);
    const blur = effect === 'clouds' ? seededValue(index, 8, 1.5, 4) : seededValue(index, 8, 0, 1.1);
    const itemOpacity = clamp(opacity * seededValue(index, 9, 0.58, 1), 0.18, 1);
    const scaleFactor = seededValue(index, 10, 0.78, 1.24) * scale;

    return {
      id: `${effect}-${index}`,
      style: {
        '--delay': `${delay.toFixed(2)}s`,
        '--drift': `${drift.toFixed(2)}px`,
        '--duration': `${(durationBase / speed).toFixed(2)}s`,
        '--left': `${left.toFixed(2)}%`,
        '--opacity': itemOpacity.toFixed(2),
        '--rotation': `${rotation.toFixed(2)}deg`,
        '--scale-item': scaleFactor.toFixed(2),
        '--size': `${sizeBase.toFixed(2)}px`,
        '--soft-blur': `${blur.toFixed(2)}px`,
        '--top': `${top.toFixed(2)}%`,
      },
    };
  });
}

/**
 * Render lớp hiệu ứng trang trí cho hero theo cấu hình env để dễ đổi theme theo mùa.
 */
function AmbientEffect() {
  const effect = normalizeEffect(import.meta.env.VITE_HERO_EFFECT);

  const settings = useMemo(() => {
    const { min, max } = EFFECT_LIMITS[effect] || { min: 0, max: 0 };
    const rawCount = Number.parseInt(import.meta.env.VITE_HERO_EFFECT_COUNT || `${min}`, 10);
    const rawOpacity = Number.parseFloat(import.meta.env.VITE_HERO_EFFECT_OPACITY || '0.72');
    const rawScale = Number.parseFloat(import.meta.env.VITE_HERO_EFFECT_SCALE || '1');
    const rawSpeed = Number.parseFloat(import.meta.env.VITE_HERO_EFFECT_SPEED || '1');

    return {
      count: effect === 'none' ? 0 : clamp(Number.isNaN(rawCount) ? min : rawCount, min, max),
      opacity: clamp(Number.isNaN(rawOpacity) ? 0.72 : rawOpacity, 0.15, 1),
      scale: clamp(Number.isNaN(rawScale) ? 1 : rawScale, 0.6, 1.8),
      speed: clamp(Number.isNaN(rawSpeed) ? 1 : rawSpeed, 0.4, 2.5),
    };
  }, [effect]);

  const items = useMemo(() => {
    if (effect === 'none' || settings.count <= 0) {
      return [];
    }

    return createEffectItems(effect, settings.count, settings.speed, settings.scale, settings.opacity);
  }, [effect, settings.count, settings.opacity, settings.scale, settings.speed]);

  if (!items.length) {
    return null;
  }

  return (
    <div aria-hidden="true" className={`ambient-effect ambient-effect--${effect}`}>
      {items.map((item) => (
        <span className="ambient-effect-item" key={item.id} style={item.style} />
      ))}
    </div>
  );
}

export default AmbientEffect;
