import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATALOG_CONFIG_PATH = path.resolve(__dirname, "./catalog-config.json");

const catalogConfig = JSON.parse(fs.readFileSync(CATALOG_CONFIG_PATH, "utf-8"));

const normalize = (value) => String(value || "").trim().toLowerCase();

export function getCatalogConfig() {
  return catalogConfig;
}

export function findCategory(categoryInput) {
  const target = normalize(categoryInput);
  if (!target) return null;

  return (
    catalogConfig.categories.find((category) => {
      return normalize(category.slug) === target || normalize(category.name) === target;
    }) || null
  );
}

export function findSubcategory(category, subcategoryInput) {
  if (!category) return null;

  const target = normalize(subcategoryInput);
  if (!target) return null;

  return (
    category.subcategories.find((subcategory) => {
      return normalize(subcategory.slug) === target || normalize(subcategory.name) === target;
    }) || null
  );
}

export function getDefaultSubcategory(category) {
  if (!category || !Array.isArray(category.subcategories) || category.subcategories.length === 0) {
    return null;
  }

  return category.subcategories[0];
}
