import Link from "next/link";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/Icon/Icon";
import { Button } from "@/components/ui/Button/Button";
import { Input, Select } from "@/components/ui/Field/Field";
import {
  formatExerciseValue,
  type ExerciseFacetOption,
  type ExerciseFacets,
  type ExerciseQuery,
} from "../../domain/exercise";
import styles from "./ExerciseFilters.module.css";

type ExerciseFiltersProps = {
  facets: ExerciseFacets;
  query: ExerciseQuery;
};

type FilterSelectProps = {
  label: string;
  name: "muscle" | "bodyPart" | "equipment" | "category";
  options: ExerciseFacetOption<string>[];
  value?: string;
};

function FilterSelect({
  label,
  name,
  options,
  value,
}: FilterSelectProps) {
  return (
    <Select
      id={`filter-${name}`}
      label={label}
      name={name}
      defaultValue={value ?? ""}
    >
      <option value="">All {label.toLocaleLowerCase("en")}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}

export function ExerciseFilters({ facets, query }: ExerciseFiltersProps) {
  const hasFilters = Boolean(
    query.search ||
      query.muscle ||
      query.bodyPart ||
      query.equipment ||
      query.category,
  );
  const activeFilters = [
    query.search ? `Search: “${query.search}”` : undefined,
    query.muscle ? `Muscle: ${formatExerciseValue(query.muscle)}` : undefined,
    query.bodyPart
      ? `Body area: ${formatExerciseValue(query.bodyPart)}`
      : undefined,
    query.equipment
      ? `Equipment: ${formatExerciseValue(query.equipment)}`
      : undefined,
    query.category
      ? `Category: ${formatExerciseValue(query.category)}`
      : undefined,
  ].filter((value): value is string => Boolean(value));

  return (
    <form className={styles.form} action="/exercises" method="get">
      <div className={styles.searchRow}>
        <Input
          id="exercise-search"
          label="Search exercises"
          type="search"
          name="search"
          maxLength={80}
          defaultValue={query.search ?? ""}
          placeholder="Try Barbell Curl"
          leadingIcon={<Icon icon={Search01Icon} size={20} />}
        />
        <Button className={styles.submitButton} type="submit">
          Apply filters
        </Button>
      </div>

      <fieldset className={styles.filterGroup}>
        <legend>Filter exercise results</legend>
        <div className={styles.filterGrid}>
          <FilterSelect
            label="Muscles"
            name="muscle"
            options={facets.muscles}
            value={query.muscle}
          />
          <FilterSelect
            label="Body areas"
            name="bodyPart"
            options={facets.bodyParts}
            value={query.bodyPart}
          />
          <FilterSelect
            label="Equipment"
            name="equipment"
            options={facets.equipment}
            value={query.equipment}
          />
          <FilterSelect
            label="Categories"
            name="category"
            options={facets.categories}
            value={query.category}
          />
        </div>
      </fieldset>

      {hasFilters && (
        <div className={styles.activeFilters}>
          <p>
            <span>Active filters:</span> {activeFilters.join("; ")}
          </p>
          <Link className={styles.clearLink} href="/exercises">
            Clear all filters
          </Link>
        </div>
      )}
    </form>
  );
}
