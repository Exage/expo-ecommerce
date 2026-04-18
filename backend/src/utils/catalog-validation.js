import {
  findCategory,
  findSubcategory,
  getDefaultSubcategory,
} from "../config/catalog.config.js";

const TYPE_CHECKERS = {
  string: (value) => typeof value === "string",
  number: (value) => typeof value === "number" && Number.isFinite(value),
  boolean: (value) => typeof value === "boolean",
  "string[]": (value) => Array.isArray(value) && value.every((item) => typeof item === "string"),
  "number[]":
    (value) =>
      Array.isArray(value) &&
      value.every((item) => typeof item === "number" && Number.isFinite(item)),
};

function parseArray(value, parser) {
  if (Array.isArray(value)) return value.map(parser);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(parser);
      } catch {
        // fallback to comma-separated parsing below
      }
    }

    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map(parser);
  }
  return [];
}

function normalizeValueByType(value, rule) {
  if (value === undefined || value === null || value === "") return rule.default;

  switch (rule.type) {
    case "string":
      return String(value);
    case "number": {
      const parsed = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(parsed)) throw new Error(`Invalid number`);
      return parsed;
    }
    case "boolean": {
      if (typeof value === "boolean") return value;
      if (typeof value === "number") return value === 1;
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true" || normalized === "1") return true;
        if (normalized === "false" || normalized === "0") return false;
      }
      throw new Error(`Invalid boolean`);
    }
    case "enum": {
      const parsed = String(value).trim().toLowerCase();
      const options = (rule.options || []).map((option) => String(option).toLowerCase());
      if (!options.includes(parsed)) throw new Error(`Invalid enum option`);
      return parsed;
    }
    case "string[]":
      return parseArray(value, (item) => String(item));
    case "number[]":
      return parseArray(value, (item) => {
        const parsed = Number(item);
        if (!Number.isFinite(parsed)) throw new Error(`Invalid number[] item`);
        return parsed;
      });
    default:
      return value;
  }
}

function parseSpecs(specsInput) {
  if (specsInput === undefined || specsInput === null || specsInput === "") return {};
  if (typeof specsInput === "object") return specsInput;

  if (typeof specsInput === "string") {
    try {
      const parsed = JSON.parse(specsInput);
      return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch {
      throw new Error("specs must be a valid JSON object");
    }
  }

  return {};
}

export function validateAndNormalizeProductDetails({ category, subcategory, specs }) {
  const matchedCategory = findCategory(category);
  if (!matchedCategory) {
    throw new Error("Invalid category");
  }

  const matchedSubcategory =
    findSubcategory(matchedCategory, subcategory) || getDefaultSubcategory(matchedCategory);

  if (!matchedSubcategory) {
    throw new Error("Invalid subcategory");
  }

  const parsedSpecs = parseSpecs(specs);
  const template = matchedSubcategory.specs || {};

  const unknownKeys = Object.keys(parsedSpecs).filter((key) => !(key in template));
  if (unknownKeys.length > 0) {
    throw new Error(`Unknown specs keys: ${unknownKeys.join(", ")}`);
  }

  const normalizedSpecs = {};

  for (const [key, rule] of Object.entries(template)) {
    try {
      const normalizedValue = normalizeValueByType(parsedSpecs[key], rule);

      if (rule.type !== "enum" && TYPE_CHECKERS[rule.type] && !TYPE_CHECKERS[rule.type](normalizedValue)) {
        throw new Error(`Invalid type`);
      }

      if (rule.required && normalizedValue === undefined) {
        throw new Error(`Required field missing`);
      }

      normalizedSpecs[key] = normalizedValue;
    } catch (error) {
      throw new Error(`Invalid specs.${key}: ${error.message}`);
    }
  }

  return {
    categoryName: matchedCategory.name,
    subcategoryName: matchedSubcategory.name,
    normalizedSpecs,
  };
}

export function parseSpecsInput(specsInput) {
  return parseSpecs(specsInput);
}
