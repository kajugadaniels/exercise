import Image from "next/image";
import { ImageNotFound01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/Icon/Icon";
import type { ExerciseSummary } from "../../domain/exercise";
import styles from "./ExerciseThumbnail.module.css";

type ExerciseThumbnailProps = Readonly<{
  image: ExerciseSummary["image"];
  size?: "card" | "detail";
}>;

export function ExerciseThumbnail({
  image,
  size = "card",
}: ExerciseThumbnailProps) {
  return (
    <div className={styles.frame} data-size={size}>
      {image ? (
        <Image
          alt={image.alt}
          className={styles.image}
          fill
          sizes={
            size === "detail"
              ? "(min-width: 48rem) 48vw, 100vw"
              : "(min-width: 64rem) 25vw, (min-width: 40rem) 50vw, 100vw"
          }
          src={image.url}
          unoptimized={image.kind === "gif"}
        />
      ) : (
        <div
          className={styles.unavailable}
          role="img"
          aria-label="Preview unavailable"
        >
          <span className={styles.icon} aria-hidden="true">
            <Icon icon={ImageNotFound01Icon} size={24} />
          </span>
          <span>Preview unavailable</span>
        </div>
      )}
    </div>
  );
}
