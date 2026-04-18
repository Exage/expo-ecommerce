import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getAllProducts } from "../controllers/admin.controller.js";
import {
  getAssistantProductSuggestions,
  getCatalogMeta,
  getProductById,
  getProductFilters,
} from "../controllers/product.controller.js";

const router = Router();

router.get("/", protectRoute, getAllProducts);
router.get("/meta", protectRoute, getCatalogMeta);
router.get("/filters", protectRoute, getProductFilters);
router.post("/assistant/suggest", protectRoute, getAssistantProductSuggestions);
router.get("/:id", protectRoute, getProductById);

export default router;
