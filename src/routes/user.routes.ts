import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { studentController } from '../controllers/student.controller';
import { teacherController } from '../controllers/teacher.controller';
import { parentController } from '../controllers/parent.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const userRouter = Router();

userRouter.use(authenticate);

userRouter.get(
  '/:userId/student-profile',
  studentController.getByUser
);

userRouter.get(
  '/:userId/teacher-profile',
  teacherController.getByUser
);

userRouter.get(
  '/:userId/parent-profile',
  parentController.getByUser
);

userRouter.get(
  '/',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  userController.getAll
);

userRouter.get(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  userController.getOne
);

userRouter.post(
  '/',
  requireRoles(['SUPER_ADMIN']),
  userController.create
);

userRouter.put(
  '/:id',
  requireRoles(['SUPER_ADMIN', 'ADMIN']),
  userController.update
);

userRouter.delete(
  '/:id',
  requireRoles(['SUPER_ADMIN']),
  userController.delete
);

export default userRouter;
