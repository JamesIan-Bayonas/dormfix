/**
 * OccupancyRing — a pure-SVG donut chart showing occupancy ratio.
 * No external charting library required.
 */

interface OccupancyRingProps {
    /** Number of currently occupied places. */
    occupied: number;
    /** Total capacity across all rooms. */
    total: number;
    /** Diameter of the SVG in pixels. Defaults to 120. */
    size?: number;
    /** Ring stroke thickness in pixels. Defaults to 12. */
    strokeWidth?: number;
}

export function OccupancyRing({ occupied, total, size = 120, strokeWidth = 12 }: OccupancyRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const ratio = total > 0 ? Math.min(occupied / total, 1) : 0;
    const filled = ratio * circumference;
    const pct = Math.round(ratio * 100);

    // Derive semantic colour from occupancy level
    let ringColor = 'var(--color-success)';
    if (pct >= 90) ringColor = 'var(--color-error)';
    else if (pct >= 70) ringColor = 'var(--color-warning)';

    return (
        <div className="df-ring-wrap" aria-label={`Occupancy: ${pct}%`}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                role="img"
                aria-hidden="true"
                style={{ overflow: 'visible' }}
            >
                {/* Track (background ring) */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--df-divider)"
                    strokeWidth={strokeWidth}
                />
                {/* Filled arc — starts from 12 o'clock */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={`${filled} ${circumference}`}
                    strokeDashoffset={circumference / 4}
                    style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.3s ease' }}
                />
                {/* Centre labels */}
                <text
                    x="50%"
                    y="50%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fontSize={size * 0.18}
                    fontWeight={700}
                    fill="var(--df-ink)"
                    fontFamily="inherit"
                >
                    {pct}%
                </text>
            </svg>
            <div className="space-y-0.5 text-center">
                <p className="text-sm font-semibold text-ink">Occupancy rate</p>
                <p className="text-xs text-muted">{occupied} of {total} places filled</p>
            </div>
        </div>
    );
}
