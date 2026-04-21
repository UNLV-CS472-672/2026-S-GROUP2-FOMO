'use client';

import { cn } from '@/lib/utils';
import { type Easing, motion } from 'motion/react';
import { useState } from 'react';

const config = {
  variant: 'dark',
  textColor: '#f7eee8',
  backgroundColor: '#181311',
  transparentBackground: false,
  pinGradientStops: [
    {
      id: 'dark-start',
      color: '#ff7f50',
      offset: 0,
    },
    {
      id: 'dark-end',
      color: '#fe4711',
      offset: 100,
    },
  ],
  pinGradientAngle: 0,
  heatColors: ['#ffa071', '#ff7f50', '#fe4711', '#ef2c07'],
  heatGlowColor: '#ffc000',
  heatGlowOpacity: 0.3,
  pinDuration: 1.08,
  pinDropHeight: 460,
  pinBounceHeight: 28,
  pinStretch: 1,
  heatDelay: 0.48,
  heatDuration: 0.56,
  ringStagger: 0.05,
  showWordmark: true,
  autoReplay: false,
  replayPause: 1.1,
} as const;

const defaultPinTransition = {
  duration: 0.9,
  ease: ['easeIn', 'easeOut', 'easeOut'] as Easing[],
  times: [0, 0.62, 0.82, 1],
};

const defaultHeatTransition = {
  duration: 0.56,
  ease: [0.22, 1, 0.36, 1],
  delay: 0.25,
} as const;

function defaultHeatRingTransition(delay: number) {
  return {
    duration: 0.28,
    ease: [0.16, 1, 0.3, 1],
    delay,
  } as const;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const fPath =
  'm121.5 372h-59v-189.5h-62v-50.5h62v-45.5q0-11.5 1.5-22.5 2-11.5 7-22 5-10.5 13-18.5 8-8.5 18-13.5 10-5.5 21.5-7.5 11.5-2 23-2 10.5 0 21 1.5 10.5 1.5 20 5.5 9.5 4 17.5 11 8.5 7 14 16 5.5 8.5 8 19 3 10.5 3 21 0 1 0 2 0 1 0 2h-59.5q0-0.5 0-0.5 0-0.5 0-1 0-5-1.5-10-1.5-5-5-8.5-3-4-8-5.5-4.5-2-9.5-2-6 0-11.5 3.5-5.5 3-8.5 8.5-3 5-4 11.5-1 6-1 12v45.5h87v50.5h-87z';
const mPath =
  'm690.6 202.7v169.3h-56.2v-152.2q0-25.5-11.4-37.8-10.6-12.7-35.5-12.7-16.4 0-27 8.7-10 7.9-15 23-4.9 14.6-4.9 34.6l-3-22.9q2.5-22.5 11.4-42.7 9.4-20.8 26.5-33.5 17.4-12.8 43.9-12.8 34.7 0 52.6 20.8 18.6 20.2 18.6 58.2zm-300-74v243.3h-56.2v-243.3zm150 74v169.3h-56.3v-152.2q0-25.5-11.4-37.8-10.6-12.7-35.5-12.7-16.3 0-27 8.7-10 7.9-15 23-4.8 14.6-4.8 34.6l-3-22.9q2.5-22.5 11.3-42.7 9.4-20.8 26.5-33.5 17.4-12.8 43.9-12.8 34.8 0 52.6 20.8 18.7 20.2 18.7 58.2z';
const mAccentLeftPath =
  'm385 180c0 0 9.6-27.38 25-38 15.4-10.62 25.6-14.58 34-16 8.4-1.42 20 1 20 1v18l-41 19-24 19-10 15zm0 0c0 0 9.6-27.38 25-38 8.45-5.83 15.33-9.65 21.21-12.15 4.84-2.05 9-3.21 12.79-3.85 8.4-1.42 20 1 20 1v18l-41 19-24 19-10 15z';
const mAccentRightPath =
  'm535 180c0 0 9.6-27.38 25-38 15.4-10.62 25.6-14.58 34-16 8.4-1.42 20 1 20 1v18l-41 19-24 19-10 15zm0 0c0 0 9.6-27.38 25-38 15.4-10.62 25.6-14.58 34-16 8.4-1.42 20 1 20 1v18l-41 19-24 19-10 15z';
const oPath =
  'm800.1 372q-35 0-62.1-15.5-26.3-16.1-41.5-44.5-14.4-29-14.4-66.6 0-38.2 14.4-66.4 15.2-28.6 41.5-44 27.1-16.3 62.1-16.3 35.5 0 61.9 16.3 27.1 15.4 42 44 15.1 28.2 15.1 66.4 0 37.6-15.1 66.6-14.9 28.4-42 44.5-26.4 15.5-61.9 15.5zm0.5-46.5q18.3 0 31.9-8 14-8.9 21.5-26.5 8.1-17.8 8.1-45.6 0-28.3-8.1-45.9-7.5-17.7-21.5-26-13.6-8.6-31.9-8.6-17.8 0-32.1 8.6-13.4 8.3-21.5 26-7.5 17.6-7.5 45.9 0 27.8 7.5 45.6 8.1 17.6 21.5 26.5 14.3 8 32.1 8z';
const pinPath =
  'm143 239c0-69.13 52.3-125 117-125 64.7 0 117 55.88 117 125 0 21.56-5.09 41.83-14.05 59.52-1.36 7.37-27.95 41.48-27.95 41.48l-27 34c0 0-24.8 31.01-30 37-5.12 5.9-11 14-13 14-2.56 0-5 0-5 0 0 0-2.44 0-5 0-2 0-7.88-8.1-13-14-5.2-5.99-30-37-30-37l-27-34c0 0-26.59-34.11-27.95-41.48-8.96-17.69-14.05-37.96-14.05-59.52zm175-0.5c0-34.56-25.93-62.5-58-62.5-32.07 0-58 27.94-58 62.5 0 34.56 25.93 62.5 58 62.5 32.07 0 58-27.94 58-62.5z';
const heatPaths = [
  {
    path: 'm262.4 463.65c-109.72 0-198.4-14-198.4-31.32 0-17.33 88.68-31.33 198.4-31.33 109.71 0 198.39 14 198.39 31.33 0 17.32-88.68 31.32-198.39 31.32z',
    baseScale: 0.3,
  },
  {
    path: 'm262.39 455.75c-85.38 0-154.39-10.89-154.39-24.37 0-13.48 69.01-24.38 154.39-24.38 85.37 0 154.39 10.9 154.39 24.38 0 13.48-69.02 24.37-154.39 24.37z',
    baseScale: 0.4,
  },
  {
    path: 'm257.56 447.18c-63.35 0-114.56-8.09-114.56-18.09 0-10 51.21-18.09 114.56-18.09 63.36 0 114.57 8.09 114.57 18.09 0 10-51.21 18.09-114.57 18.09z',
    baseScale: 0.45,
  },
  {
    path: 'm260.5 437c-36.77 0-66.5-4.69-66.5-10.5 0-5.81 29.73-10.5 66.5-10.5 36.77 0 66.5 4.69 66.5 10.5 0 5.81-29.73 10.5-66.5 10.5z',
    baseScale: 0.5,
  },
] as const;

export function FomoAnimate({
  textColor = 'currentColor',
  className,
  scalePinHeat,
  animationDelayMs = 0,
}: {
  textColor?: string;
  className?: string;
  scalePinHeat?: boolean;
  animationDelayMs?: number;
}) {
  const [isMouseEntered, setIsMouseEntered] = useState(false);
  const isHovered = scalePinHeat && isMouseEntered;
  const gradientId = 'fomo-animate-pin-gradient';
  const filterId = 'fomo-animate-heat-filter';
  const introDelaySeconds = Math.max(0, animationDelayMs) / 1000;

  const bounceLift = config.pinBounceHeight;
  const stretch = clamp(config.pinStretch, 0, 1.6);
  const impactScaleX = 1 + stretch * 0.11;
  const impactScaleY = clamp(1 - stretch * 0.16, 0.72, 1);
  const preImpactScaleX = 1 - stretch * 0.02;
  const preImpactScaleY = 1 + stretch * 0.04;
  const reboundScaleX = 1 - stretch * 0.03;
  const reboundScaleY = 1 + stretch * 0.06;
  const settleScaleX = 1 + stretch * 0.02;
  const settleScaleY = 1 - stretch * 0.01;

  return (
    <svg
      version="1.2"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 920 464"
      className={cn('block h-16 w-auto overflow-visible', className)}
      overflow="visible"
      aria-label="Animated Fomo logo"
      onMouseEnter={scalePinHeat ? () => setIsMouseEntered(true) : undefined}
      onMouseLeave={scalePinHeat ? () => setIsMouseEntered(false) : undefined}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
          gradientTransform={`rotate(${config.pinGradientAngle + 45} 0.5 0.5)`}
        >
          {[...config.pinGradientStops]
            .sort((a, b) => a.offset - b.offset)
            .map((stop) => (
              <stop key={stop.id} offset={`${stop.offset}%`} stopColor={stop.color} />
            ))}
        </linearGradient>
        <filter id={filterId}>
          <feFlood floodColor={config.heatGlowColor} floodOpacity={config.heatGlowOpacity} />
          <feBlend mode="normal" in2="SourceGraphic" />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
      </defs>

      <g
        style={{
          transformBox: 'view-box',
          transformOrigin: 'center center',
        }}
      >
        <motion.g
          animate={{
            scale: isHovered ? 1.1 : 1,
            translateY: isHovered ? 25 : 0,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center center' }}
        >
          <motion.g
            initial={{ scaleX: 0.72, scaleY: 0.18 }}
            animate={{ scaleX: 1, scaleY: 1 }}
            transition={{
              duration: config.heatDuration,
              ease: defaultHeatTransition.ease,
              delay: config.heatDelay + introDelaySeconds,
            }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center center' }}
          >
            <g filter={`url(#${filterId})`}>
              {heatPaths.map((ring, index) => {
                const reverseIndex = heatPaths.length - 1 - index;

                return (
                  <motion.path
                    key={ring.path}
                    d={ring.path}
                    fill={config.heatColors[index]}
                    fillRule="evenodd"
                    initial={{ opacity: 0, scale: ring.baseScale }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={defaultHeatRingTransition(
                      introDelaySeconds +
                        config.heatDelay +
                        config.ringStagger +
                        reverseIndex * config.ringStagger
                    )}
                    style={{
                      transformBox: 'fill-box',
                      transformOrigin: 'center center',
                    }}
                  />
                );
              })}
            </g>
          </motion.g>
        </motion.g>

        {config.showWordmark ? (
          <g>
            <path d={fPath} fill={textColor} aria-label="f" />
            <g>
              <path d={mPath} fill={textColor} aria-label="m" />
              <path d={mAccentRightPath} fill={textColor} />
              <path d={mAccentLeftPath} fill={textColor} />
            </g>
            <path d={oPath} fill={textColor} aria-label="o" />
          </g>
        ) : null}

        <motion.g
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}
        >
          <motion.path
            d={pinPath}
            fill={`url(#${gradientId})`}
            fillRule="evenodd"
            initial={{
              y: -config.pinDropHeight,
              scaleX: 1,
              scaleY: 1,
            }}
            animate={{
              y: [
                -config.pinDropHeight,
                bounceLift,
                -bounceLift * (20 / 28),
                bounceLift * (6 / 28),
                0,
              ],
              scaleX: [preImpactScaleX, impactScaleX, reboundScaleX, settleScaleX, 1],
              scaleY: [preImpactScaleY, impactScaleY, reboundScaleY, settleScaleY, 1],
            }}
            transition={{
              duration: config.pinDuration,
              ease: defaultPinTransition.ease,
              times: defaultPinTransition.times,
              delay: introDelaySeconds,
            }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}
          />
        </motion.g>
      </g>
    </svg>
  );
}
