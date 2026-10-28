"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Cancel01Icon, Search02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/Icon/Icon";
import type { ExerciseQuery } from "../../domain/exercise";
import styles from "./ExerciseSearch.module.css";

type ExerciseSearchProps = Readonly<{
  clearSearchHref: string;
  query: ExerciseQuery;
}>;

export function ExerciseSearch({
  clearSearchHref,
  query,
}: ExerciseSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const [isExpanded, setIsExpanded] = useState(Boolean(query.search));
  const [search, setSearch] = useState(query.search ?? "");
  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  function closeSearch() {
    setSearch("");
    setIsExpanded(false);
    requestAnimationFrame(() => openButtonRef.current?.focus());

    if (query.search) {
      router.replace(clearSearchHref, { scroll: false });
    }
  }

  return (
    <div className={styles.controls}>
      {isExpanded ? (
        <form className={styles.searchForm} action="/exercises" role="search">
          <button
            className={styles.searchSubmit}
            type="submit"
            aria-label="Search exercises"
          >
            <Icon icon={Search02Icon} size={20} />
          </button>
          <label className={styles.visuallyHidden} htmlFor="exercise-search">
            Search exercises
          </label>
          <input
            className={styles.searchInput}
            id="exercise-search"
            maxLength={80}
            minLength={3}
            name="search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search exercises (3+ characters)…"
            ref={inputRef}
            required
            type="search"
            value={search}
          />
          {query.bodyPart ? (
            <input name="bodyPart" type="hidden" value={query.bodyPart} />
          ) : null}
          {query.category ? (
            <input name="category" type="hidden" value={query.category} />
          ) : null}
          {query.equipment ? (
            <input name="equipment" type="hidden" value={query.equipment} />
          ) : null}
          {query.muscle ? (
            <input name="muscle" type="hidden" value={query.muscle} />
          ) : null}
          <button
            className={styles.closeButton}
            onClick={closeSearch}
            title="Close search"
            type="button"
            aria-label="Close search"
          >
            <Icon icon={Cancel01Icon} size={20} />
          </button>
        </form>
      ) : (
        <button
          className={styles.roundButton}
          onClick={() => setIsExpanded(true)}
          ref={openButtonRef}
          title="Open search"
          type="button"
          aria-label="Open exercise search"
        >
          <Icon icon={Search02Icon} size={20} />
        </button>
      )}
    </div>
  );
}
