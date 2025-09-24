import { Router } from 'express';
import { LeadsController } from '../controllers/leads.controller';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';

export function createLeadsRoutes(prisma: PrismaClient) {
  const router = Router();
  const leadsController = new LeadsController(prisma);

  // Aplicar middleware de autenticação em todas as rotas
  router.use(authMiddleware);

  // Rotas de leads
  router.get('/', (req, res) => leadsController.getLeads(req, res));
  router.get('/stats', (req, res) => leadsController.getLeadsStats(req, res));
  router.get('/:leadId', (req, res) => leadsController.getLeadById(req, res));
  router.post('/', (req, res) => leadsController.createLead(req, res));
  router.patch('/:leadId', (req, res) => leadsController.updateLead(req, res));
  router.delete('/:leadId', (req, res) => leadsController.deleteLead(req, res));

  return router;
}
