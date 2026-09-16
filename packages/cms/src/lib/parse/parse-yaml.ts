import yaml, { type SchemaDefinition } from "js-yaml";

const { DEFAULT_SAFE_SCHEMA, Schema, safeLoad } = yaml;
const defaultSchema = DEFAULT_SAFE_SCHEMA as Required<SchemaDefinition>;

const YAML_TIMESTAMP_TAG = "tag:yaml.org,2002:timestamp";

const schema = new Schema({
  ...defaultSchema,
  // Only explicit !!timestamp tags should construct dates.
  implicit: defaultSchema.implicit.filter(
    (type: { tag: string }) => type.tag != YAML_TIMESTAMP_TAG,
  ),
  explicit: [
    ...defaultSchema.explicit,
    ...defaultSchema.implicit.filter(
      (type: { tag: string }) => type.tag == YAML_TIMESTAMP_TAG,
    ),
  ],
});

export function parseYaml(data: string) {
  const parsed = safeLoad(data, { schema });

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
