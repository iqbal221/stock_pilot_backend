import express from 'express';
import  { authRoutes } from '../modules/auth/auth.routes';

import { SupplierRoutes } from '../modules/suppliers/suppliers.routes';
import { CategoryRoutes } from '../modules/categories/categories.routes';
import { ProductRoutes } from '../modules/products/products.routes';
import { stockMovementRoutes } from '../modules/stock-movement/stock_movement.routes';
import { purchasePaymentRoutes } from '../modules/purchase_payment/purchase_payment.routes 3';
import { salesRoutes } from '../modules/sales/sale.routes';


const router = express.Router();

const moduleRoutes: any[] = [
  // ... routes
  {
    path: '/auth',
    route: authRoutes,
  },
  {
    path: '/categories',
    route: CategoryRoutes,
  },
  {
    path: '/products',
    route: ProductRoutes,
  },
  {
    path: '/suppliers',
    route: SupplierRoutes,
  },
  {
    path: '/stock_movement',
    route: stockMovementRoutes,
  },
  {
    path: '/purchase_payment',
    route: purchasePaymentRoutes,
  },
  {
    path: '/sales',
    route: salesRoutes,
  },
//   {
//     path: '/auth',
//     route: authRoutes,
//   },
//   {
//     path: '/user',
//     route: userRoutes,
//   },
//   {
//     path: '/admin',
//     route: adminRoutes,
//   },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));
export default router;
