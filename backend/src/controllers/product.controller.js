import {
  findCategory,
  findSubcategory,
  getCatalogConfig,
  getDefaultSubcategory,
} from "../config/catalog.config.js";
import {
  getProductByIdSource,
  getProductsForFiltersSource,
  searchProductsSource,
} from "../services/products.provider.js";
import {
  extractSearchTermsFromGemini,
  getProductRecommendationsFromGemini,
  isGeminiConfigured,
} from "../services/gemini.service.js";

function debugLog(message, payload) {
  if (payload === undefined) {
    console.log(`[DEBUG] [ProductAssistant] ${message}`);
    return;
  }
  console.log(`[DEBUG] [ProductAssistant] ${message}`, payload);
}

function makeSpecLabel(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueSorted(values) {
  const unique = Array.from(new Set(values.filter((value) => value !== undefined && value !== null)));
  return unique.sort((a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
  });
}

function collectValues(products, specKey, specType) {
  const rawValues = [];

  for (const product of products) {
    const value = product?.specs?.[specKey];
    if (value === undefined || value === null || value === "") continue;

    if (specType === "string[]" || specType === "number[]") {
      if (Array.isArray(value)) {
        value.forEach((item) => rawValues.push(item));
      }
      continue;
    }

    rawValues.push(value);
  }

  return uniqueSorted(rawValues);
}

function normalizeQuery(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const TOKEN_SYNONYMS = {
  посоветуй: ["recommend", "best"],
  порекомендуй: ["recommend", "best"],
  лучший: ["best", "top"],
  мышь: ["mouse", "mice", "wireless mouse", "gaming mouse"],
  мышка: ["mouse", "wireless mouse", "gaming mouse"],
  клавиатура: ["keyboard", "mechanical keyboard"],
  наушники: ["headphones", "earbuds", "headset"],
  самсунг: ["samsung", "galaxy"],
  samsung: ["самсунг", "galaxy"],
  мак: ["macbook", "apple laptop"],
  макбук: ["macbook", "apple laptop", "laptop", "notebook"],
  маки: ["macbook", "apple laptop"],
  айфон: ["iphone", "smartphone", "phone"],
  ноутбук: ["laptop", "notebook", "macbook"],
  телефон: ["phone", "smartphone", "iphone"],
  смартфон: ["smartphone", "phone", "iphone"],
  планшет: ["tablet", "ipad"],
  часы: ["smartwatch", "watch"],
  камера: ["camera", "webcam"],
  монитор: ["monitor", "display"],
  телевизор: ["tv", "television"],
};

const QUERY_STOP_WORDS = new Set([
  "посоветуй",
  "порекомендуй",
  "подбери",
  "покажи",
  "мне",
  "модель",
  "модели",
  "хочу",
  "нужен",
  "нужна",
  "нужно",
]);

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

function expandTokens(tokens) {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    for (const [key, synonyms] of Object.entries(TOKEN_SYNONYMS)) {
      if (token === key || token.startsWith(key) || key.startsWith(token)) {
        for (const synonym of synonyms) expanded.add(synonym);
      }
    }
  }
  return Array.from(expanded).slice(0, 20);
}

function buildLocalAssistantMessage(query, productsCount) {
  if (productsCount === 0) {
    return `По запросу "${query}" подходящих товаров не нашлось.`;
  }

  const variants = [
    "Нашел несколько хороших вариантов под ваш запрос.",
    "Подобрал релевантные позиции, можете начать с них.",
    "Есть подходящие товары, собрал лучшие варианты.",
    "Выбрал самые близкие по смыслу товары из каталога.",
  ];

  const hash = Array.from(String(query || "")).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return variants[hash % variants.length];
}

function hasStrongMatch(product, tokens) {
  return scoreProductMatch(product, tokens) >= 2;
}

function buildSearchRegex(tokens) {
  if (tokens.length === 0) return null;
  const escapedTokens = tokens.map((token) => escapeRegExp(token)).filter(Boolean);
  if (escapedTokens.length === 0) return null;
  return new RegExp(escapedTokens.join("|"), "i");
}

function productToAiInput(product) {
  return {
    id: String(product._id),
    name: product.name,
    price: product.price,
    category: product.category,
    subcategory: product.subcategory,
    description: String(product.description || "").slice(0, 220),
    inStock: product.stock > 0,
    rating: product.averageRating,
  };
}

function scoreAndRankProducts(products, tokens) {
  return products
    .map((product) => ({ product, score: scoreProductMatch(product, tokens) }))
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product);
}

function mapProductIdsToProducts(productIds, products) {
  return productIds
    .map((id) => products.find((product) => String(product._id) === String(id)))
    .filter(Boolean);
}

function getQueryTokens(query) {
  const baseTokens = tokenizeQuery(query);
  return expandTokens(baseTokens);
}

function tokenizeQuery(value) {
  return normalizeQuery(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !QUERY_STOP_WORDS.has(token))
    .slice(0, 12);
}

function scoreProductMatch(product, tokens) {
  const normalizedSpecs = normalizeQuery(flattenSpecValues(product.specs).join(" "));
  const normalizedName = normalizeQuery(product.name);
  const normalizedDescription = normalizeQuery(product.description);
  const normalizedCategory = normalizeQuery(product.category);
  const normalizedSubcategory = normalizeQuery(product.subcategory);
  const haystack = normalizeQuery(
    [product.name, product.description, product.category, product.subcategory, normalizedSpecs].join(" ")
  );
  if (!haystack || tokens.length === 0) return 0;

  return tokens.reduce((score, token) => {
    if (!haystack.includes(token)) return score;

    // Name matches are the strongest, but taxonomy matches
    // should also pass relevance checks for category queries.
    if (normalizedName.includes(token)) return score + 3;
    if (normalizedSubcategory.includes(token)) return score + 2;
    if (normalizedCategory.includes(token)) return score + 1;
    if (normalizedSpecs.includes(token)) return score + 2;
    if (normalizedDescription.includes(token)) return score + 1;

    return score;
  }, 0);
}

export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const product = await getProductByIdSource(id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export function getCatalogMeta(_, res) {
  try {
    const catalog = getCatalogConfig();
    res.status(200).json(catalog);
  } catch (error) {
    console.error("Error fetching catalog meta:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getProductFilters(req, res) {
  try {
    const { category, subcategory } = req.query;

    if (!category) {
      return res.status(400).json({ message: "Query param `category` is required" });
    }

    const matchedCategory = findCategory(category);
    if (!matchedCategory) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const requestedSubcategory = subcategory ? findSubcategory(matchedCategory, subcategory) : null;

    if (subcategory && !requestedSubcategory) {
      return res.status(400).json({ message: "Invalid subcategory" });
    }

    const matchedSubcategory = requestedSubcategory || getDefaultSubcategory(matchedCategory);

    if (!matchedSubcategory) {
      return res.status(400).json({ message: "Invalid subcategory" });
    }

    const products = await getProductsForFiltersSource({
      category: matchedCategory.name,
      subcategory: matchedSubcategory.name,
    });

    const specsTemplate = matchedSubcategory.specs || {};
    const filters = Object.entries(specsTemplate)
      .filter(([, rule]) => Boolean(rule?.filterable))
      .map(([key, rule]) => {
        const values = collectValues(products, key, rule.type);
        const baseFilter = {
          key,
          label: makeSpecLabel(key),
          type: rule.type,
          unit: rule.unit || null,
          values,
        };

        if (rule.type === "number" || rule.type === "number[]") {
          const numericValues = values.filter((value) => typeof value === "number");
          return {
            ...baseFilter,
            min: numericValues.length > 0 ? Math.min(...numericValues) : null,
            max: numericValues.length > 0 ? Math.max(...numericValues) : null,
          };
        }

        if (rule.type === "enum") {
          const options = uniqueSorted([...(rule.options || []), ...values]);
          return {
            ...baseFilter,
            options,
          };
        }

        return baseFilter;
      });

    res.status(200).json({
      category: {
        slug: matchedCategory.slug,
        name: matchedCategory.name,
      },
      subcategory: {
        slug: matchedSubcategory.slug,
        name: matchedSubcategory.name,
      },
      filters,
    });
  } catch (error) {
    console.error("Error fetching product filters:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAssistantProductSuggestions(req, res) {
  try {
    const { query, limit } = req.body || {};
    const normalizedQuery = String(query || "").trim();

    debugLog("Incoming request", { query: normalizedQuery, limit });

    if (!normalizedQuery) {
      debugLog("Validation failed: missing query");
      return res.status(400).json({ message: "Field `query` is required" });
    }

    const queryTokens = getQueryTokens(normalizedQuery);
    let activeTokens = [...queryTokens];
    const maxProducts = Number.isFinite(Number(limit))
      ? Math.min(Math.max(parseInt(limit, 10), 1), 12)
      : 6;

    debugLog("Prepared search tokens", { queryTokens: activeTokens, maxProducts });

    const searchRegex = buildSearchRegex(activeTokens);
    debugLog("Built search regex", {
      hasRegex: Boolean(searchRegex),
      regex: searchRegex ? searchRegex.toString() : null,
    });

    let candidateProducts = [];
    if (searchRegex) {
      candidateProducts = await searchProductsSource({
        searchRegex,
        limit: 60,
      });
    }

    debugLog("Fetched candidate products", {
      count: candidateProducts.length,
      ids: candidateProducts.map((product) => String(product._id)).slice(0, 20),
    });

    if (candidateProducts.length === 0) {
      debugLog("No candidates found in initial DB search");

      if (isGeminiConfigured()) {
        try {
          const termExtraction = await extractSearchTermsFromGemini({
            userQuery: normalizedQuery,
            originalTokens: activeTokens,
          });

          debugLog("Gemini term extraction completed", termExtraction);

          if (Array.isArray(termExtraction.terms) && termExtraction.terms.length > 0) {
            activeTokens = expandTokens([...activeTokens, ...termExtraction.terms]);
            const expandedSearchRegex = buildSearchRegex(activeTokens);

            debugLog("Built expanded regex from Gemini terms", {
              activeTokens,
              hasRegex: Boolean(expandedSearchRegex),
              regex: expandedSearchRegex ? expandedSearchRegex.toString() : null,
            });

            if (expandedSearchRegex) {
              candidateProducts = await searchProductsSource({
                searchRegex: expandedSearchRegex,
                limit: 60,
              });
            }

            debugLog("Fetched candidates after Gemini expansion", {
              count: candidateProducts.length,
              ids: candidateProducts.map((product) => String(product._id)).slice(0, 20),
            });
          }
        } catch (expansionError) {
          debugLog("Gemini term extraction failed", {
            errorMessage: expansionError?.message || "unknown_error",
          });
        }
      }

      if (candidateProducts.length === 0) {
        debugLog("Fallback: still no candidates after Gemini expansion");
        return res.status(200).json({
          query: normalizedQuery,
          assistantMessage: buildLocalAssistantMessage(normalizedQuery, 0),
          source: "fallback",
          products: [],
        });
      }
    }

    const rankedCandidates = scoreAndRankProducts(candidateProducts, activeTokens);
    const relevantCandidates = rankedCandidates.filter((product) => hasStrongMatch(product, activeTokens));
    debugLog("Ranked and filtered candidates", {
      rankedCount: rankedCandidates.length,
      relevantCount: relevantCandidates.length,
      relevantIds: relevantCandidates.map((product) => String(product._id)).slice(0, 20),
    });

    if (relevantCandidates.length === 0) {
      debugLog("Fallback: no strong matches after scoring");
      return res.status(200).json({
        query: normalizedQuery,
        assistantMessage: buildLocalAssistantMessage(normalizedQuery, 0),
        source: "fallback",
        products: [],
      });
    }

    const compactProducts = relevantCandidates.slice(0, 12).map(productToAiInput);

    let aiResult = {
      assistantMessage: "",
      productIds: [],
      isFromGemini: false,
      debugReason: "gemini_not_called",
    };

    if (isGeminiConfigured()) {
      debugLog("Gemini is configured, sending request", { compactProductsCount: compactProducts.length });
      try {
        aiResult = await getProductRecommendationsFromGemini({
          userQuery: normalizedQuery,
          products: compactProducts,
        });
        debugLog("Gemini responded", aiResult);
      } catch (geminiError) {
        console.error("Gemini recommendation failed:", geminiError);
        debugLog("Fallback: Gemini threw an error", {
          errorMessage: geminiError?.message || "unknown_error",
        });
      }
    } else {
      debugLog("Fallback: Gemini is not configured");
    }

    const selectedByAi = mapProductIdsToProducts(aiResult.productIds, relevantCandidates);
    const fallbackSelected = relevantCandidates.slice(0, maxProducts);
    const finalProducts = (selectedByAi.length > 0 ? selectedByAi : fallbackSelected).slice(
      0,
      maxProducts
    );

    const usedGemini = aiResult.isFromGemini && selectedByAi.length > 0;
    debugLog("Selection completed", {
      usedGemini,
      selectedByAiCount: selectedByAi.length,
      fallbackSelectedCount: fallbackSelected.length,
      finalProductsCount: finalProducts.length,
      geminiDebugReason: aiResult.debugReason || "unknown",
    });

    res.status(200).json({
      query: normalizedQuery,
      assistantMessage:
        aiResult.assistantMessage || buildLocalAssistantMessage(normalizedQuery, finalProducts.length),
      source: usedGemini ? "gemini" : "fallback",
      products: finalProducts,
    });
  } catch (error) {
    console.error("Error generating product suggestions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
