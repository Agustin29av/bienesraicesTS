// src/routes/Sellers.ts
import { Router } from "express";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { auth, requireRole } from "../middlewares/authMiddleware";
import {
  createSellerBody,
  updateSellerBody,
  sellerIdParam,
  listSellersQuery,
} from "../DTOs/sellers.dto";
import * as SellerController from "../controllers/SellerController";

const router = Router();

// Públicos (podés exigir auth si querés)
router.get(
  "/",
  validate({ query: listSellersQuery }),
  asyncHandler(SellerController.getSellers)
);

router.get(
  "/:id",
  validate({ params: sellerIdParam }),
  asyncHandler(SellerController.getSellerById)
);

// Protegidos
router.post(
  "/",
  auth(),                                   // token requerido
  requireRole("admin", "seller"),
  validate({ body: createSellerBody }),     // ✅ no valida params acá
  asyncHandler(SellerController.createSeller)
);

router.put(
  "/:id",
  auth(),                                   // ✅ token requerido (no opcional)
  requireRole("admin", "seller"),
  validate({ params: sellerIdParam, body: updateSellerBody }),
  asyncHandler(SellerController.updateSeller)
);

router.delete(
  "/:id",
  auth(),                                   // ✅ token requerido
  requireRole("admin"),
  validate({ params: sellerIdParam }),
  asyncHandler(SellerController.removeSeller)
);

export default router;
