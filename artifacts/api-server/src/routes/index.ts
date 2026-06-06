import { Router, type IRouter } from "express";
import healthRouter from "./health";
import walletsRouter from "./wallets";
import transactionsRouter from "./transactions";
import alertsRouter from "./alerts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(walletsRouter);
router.use(transactionsRouter);
router.use(alertsRouter);

export default router;
