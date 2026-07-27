import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollment.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new EnrollmentController();

router.use(authenticate);

router.get('/', requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']), (req, res, next) => controller.getAll(req, res, next));
router.get('/:id', requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']), (req, res, next) => controller.getOne(req, res, next));

router.post('/', requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']), (req, res, next) => controller.create(req, res, next));
router.put('/:id', requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']), (req, res, next) => controller.update(req, res, next));
router.delete('/:id', requireRoles(['SUPER_ADMIN', 'ADMIN', 'STUDENT']), (req, res, next) => controller.delete(req, res, next));

router.patch('/:id/status', requireRoles(['SUPER_ADMIN', 'ADMIN']), (req, res, next) => controller.patchStatus(req, res, next));

export default router;
