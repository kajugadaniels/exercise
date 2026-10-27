import type { BmiCategory } from "../../profile-schema";
import styles from "./BodyMetricsVisual.module.css";

type BodyMetricsVisualProps = Readonly<{
  bmiCategory: BmiCategory | null;
  heightCentimeters: number | null;
  weightKilograms: number | null;
}>;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function BodyMetricsVisual({
  bmiCategory,
  heightCentimeters,
  weightKilograms,
}: BodyMetricsVisualProps) {
  const height = heightCentimeters ? `${heightCentimeters} cm` : "— cm";
  const weight = weightKilograms ? `${weightKilograms} kg` : "— kg";
  const heightScale = heightCentimeters
    ? clamp(heightCentimeters / 175, 0.9, 1.1)
    : 1;
  const bmi =
    heightCentimeters && weightKilograms
      ? weightKilograms / (heightCentimeters / 100) ** 2
      : null;
  const widthScale = bmi ? clamp(bmi / 22, 0.86, 1.16) : 1;

  return (
    <figure
      className={styles.visual}
      data-tone={bmiCategory ?? "empty"}
      aria-label={`Body measurement preview. Height ${height}. Weight ${weight}.`}
    >
      <figcaption className={styles.caption}>Live body profile</figcaption>
      <div className={styles.stage} aria-hidden="true">
        <svg className={styles.diagram} viewBox="0 0 240 260" role="presentation">
          <g className={styles.orbit}>
            <circle className={styles.orbitLine} cx="120" cy="127" r="91" />
            <circle className={styles.orbitPoint} cx="120" cy="36" r="5" />
            <circle className={styles.orbitPoint} cx="211" cy="127" r="3" />
          </g>

          <g className={styles.heightGuide}>
            <path d="M34 53V219" />
            <path d="M27 53H41M27 219H41" />
          </g>

          <g
            className={styles.body}
            style={{ transform: `scale(${widthScale}, ${heightScale})` }}
          >
            <circle cx="121" cy="70" r="17" />
            <path d="M93 110C100 98 108 94 121 94C134 94 142 98 149 110L143 160C141 172 137 178 132 182L139 222H121L115 184L109 222H91L100 182C95 177 92 170 91 160L93 110Z" />
            <path d="M95 111L75 157M147 111L166 157" />
          </g>

          <g className={styles.floor}>
            <path d="M78 229H164" />
            <path d="M94 222V229M139 222V229" />
          </g>
        </svg>

        <span className={styles.heightValue}>{height}</span>
        <span className={styles.weightValue}>{weight}</span>
      </div>
    </figure>
  );
}
