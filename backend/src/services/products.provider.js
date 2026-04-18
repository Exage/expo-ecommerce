import { ENV } from "../config/env.js";
import { Product } from "../models/product.model.js";
import { MOCK_PRODUCTS } from "../mocks/products.mock.js";

function sortByCreatedAtDesc(items) {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function flattenSpecValues(value, acc = []) {
  if (value === undefined || value === null) return acc;
  if (Array.isArray(value)) {
    value.forEach((item) => flattenSpecValues(item, acc));
    return acc;
  }
  if (typeof value === "object") {
    Object.values(value).forEach((item) => flattenSpecValues(item, acc));
    return acc;
  }
  acc.push(String(value));
  return acc;
}

export function isUsingMockProducts() {
  return Boolean(ENV.DEV_USE_MOCK_PRODUCTS);
}

export async function getAllProductsSource() {
  if (isUsingMockProducts()) {
    return sortByCreatedAtDesc(MOCK_PRODUCTS);
  }

  return Product.find().sort({ createdAt: -1 });
}

export async function getProductByIdSource(id) {
  if (isUsingMockProducts()) {
    return MOCK_PRODUCTS.find((product) => String(product._id) === String(id)) || null;
  }

  return Product.findById(id);
}

export async function getProductsForFiltersSource({ category, subcategory }) {
  if (isUsingMockProducts()) {
    return MOCK_PRODUCTS.filter((product) => {
      return product.category === category && product.subcategory === subcategory;
    }).map((product) => ({ specs: product.specs || {} }));
  }

  return Product.find({ category, subcategory }).select({ specs: 1 });
}

export async function searchProductsSource({ searchRegex, limit = 60 }) {
  if (!searchRegex) return [];

  if (isUsingMockProducts()) {
    const filtered = MOCK_PRODUCTS.filter((product) => {
      const searchableFields = [
        product.name,
        product.description,
        product.category,
        product.subcategory,
        ...(flattenSpecValues(product.specs) || []),
      ];
      return searchableFields.some((field) => searchRegex.test(String(field || "")));
    });
    return sortByCreatedAtDesc(filtered).slice(0, limit);
  }

  return Product.find({
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
      { subcategory: searchRegex },
      { "specs.brand": searchRegex },
      { "specs.model": searchRegex },
      { "specs.operatingSystem": searchRegex },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(limit);
}
