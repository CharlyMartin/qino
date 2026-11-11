import {
  CORE_SCHEMA,
  defineScalarTag,
  loadAll,
  mergeTag,
  timestampTag,
} from "js-yaml";

// YAML 1.2 core schema, plus merge keys (`<<`) and explicit-only
// `!!timestamp` tags. Untagged dates stay strings.
const schema = CORE_SCHEMA.withTags(
  mergeTag,
  defineScalarTag(timestampTag.tagName, { ...timestampTag, implicit: false }),
);

export function parseYaml(data: string) {
  const [parsed, ...rest] = loadAll(data, { schema });

  if (rest.length > 0) {
    throw new Error("YAML frontmatter must contain a single document.");
  }

  if (parsed == null) return {};

  if (
    typeof parsed != "object" ||
    Object.getPrototypeOf(parsed) != Object.prototype
  ) {
    throw new Error(
      "YAML frontmatter must be a mapping of field names to values.",
    );
  }

  return parsed;
}
