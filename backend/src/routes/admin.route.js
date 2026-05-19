import { Router } from "express";
import {
  createProduct,
  getAllCustomers,
  getAllOrders,
  getAllProducts,
  getDashboardStats,
  updateOrderStatus,
  updateProduct,
  deleteProduct,
} from "../controllers/admin.controller.js";
import { ENV } from "../config/env.js";
import { adminOnly, protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

// optimization - DRY
if (ENV.DEV_BYPASS_ADMIN_ROUTES_AUTH) {
  router.use((req, _res, next) => {
    req.user = req.user || { email: ENV.ADMIN_EMAIL || "dev@local" };
    next();
  });
} else {
  router.use(protectRoute, adminOnly);
}

router.post("/products", upload.array("images", 3), createProduct);
router.get("/products", getAllProducts);
router.put("/products/:id", upload.array("images", 3), updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/orders", getAllOrders);
router.patch("/orders/:orderId/status", updateOrderStatus);

router.get("/customers", getAllCustomers);

router.get("/stats", getDashboardStats);

// PUT: Used for full resource replacement, updating the entire resource
// PATCH: Used for partial resource updates, updating a specific part of the resource

export default router;
