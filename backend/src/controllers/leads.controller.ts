import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../logger';

export class LeadsController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Buscar leads
  async getLeads(req: Request, res: Response) {
    try {
      const ownerId = req.headers['x-user-id'] as string;
      const { status, search, limit = 100, offset = 0 } = req.query;

      if (!ownerId) {
        return res.status(400).json({ success: false, error: 'Owner ID é obrigatório' });
      }

      let whereClause: any = {
        ownerId,
      };

      // Filtrar por status se especificado
      if (status) {
        whereClause.status = status;
      }

      // Busca por texto se especificado
      if (search) {
        whereClause.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { company: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const leads = await this.prisma.leads.findMany({
        where: whereClause,
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: {
          created_at: 'desc',
        },
      });

      const total = await this.prisma.leads.count({
        where: whereClause,
      });

      res.json({ 
        success: true, 
        data: leads,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: (parseInt(offset as string) + parseInt(limit as string)) < total,
        },
      });
    } catch (error: any) {
      logger.error('Erro ao buscar leads:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Buscar lead por ID
  async getLeadById(req: Request, res: Response) {
    try {
      const ownerId = req.headers['x-user-id'] as string;
      const { leadId } = req.params;

      if (!ownerId) {
        return res.status(400).json({ success: false, error: 'Owner ID é obrigatório' });
      }

      const lead = await this.prisma.leads.findFirst({
        where: {
          id: leadId,
          ownerId,
        },
        include: {
          activities: {
            orderBy: {
              scheduled_date: 'desc',
            },
            take: 10,
          },
        },
      });

      if (!lead) {
        return res.status(404).json({ success: false, error: 'Lead não encontrado' });
      }

      res.json({ success: true, data: lead });
    } catch (error: any) {
      logger.error('Erro ao buscar lead:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Criar lead
  async createLead(req: Request, res: Response) {
    try {
      const ownerId = req.headers['x-user-id'] as string;
      const {
        name,
        email,
        phone,
        company,
        source,
        status = 'new',
        assigned_to,
        value,
        notes,
      } = req.body;

      if (!ownerId) {
        return res.status(400).json({ success: false, error: 'Owner ID é obrigatório' });
      }

      if (!name) {
        return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
      }

      const lead = await this.prisma.leads.create({
        data: {
          ownerId,
          name,
          email,
          phone,
          company,
          source,
          status,
          assigned_to,
          value,
          notes,
        },
      });

      res.json({ success: true, data: lead });
    } catch (error: any) {
      logger.error('Erro ao criar lead:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Atualizar lead
  async updateLead(req: Request, res: Response) {
    try {
      const ownerId = req.headers['x-user-id'] as string;
      const { leadId } = req.params;
      const updateData = req.body;

      if (!ownerId) {
        return res.status(400).json({ success: false, error: 'Owner ID é obrigatório' });
      }

      // Buscar lead existente
      const existingLead = await this.prisma.leads.findFirst({
        where: {
          id: leadId,
          ownerId,
        },
      });

      if (!existingLead) {
        return res.status(404).json({ success: false, error: 'Lead não encontrado' });
      }

      // Preparar dados para atualização
      const updateFields: any = {};
      
      if (updateData.name !== undefined) updateFields.name = updateData.name;
      if (updateData.email !== undefined) updateFields.email = updateData.email;
      if (updateData.phone !== undefined) updateFields.phone = updateData.phone;
      if (updateData.company !== undefined) updateFields.company = updateData.company;
      if (updateData.source !== undefined) updateFields.source = updateData.source;
      if (updateData.status !== undefined) updateFields.status = updateData.status;
      if (updateData.assigned_to !== undefined) updateFields.assigned_to = updateData.assigned_to;
      if (updateData.value !== undefined) updateFields.value = updateData.value;
      if (updateData.notes !== undefined) updateFields.notes = updateData.notes;

      const updatedLead = await this.prisma.leads.update({
        where: { id: leadId },
        data: updateFields,
      });

      res.json({ success: true, data: updatedLead });
    } catch (error: any) {
      logger.error('Erro ao atualizar lead:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Deletar lead
  async deleteLead(req: Request, res: Response) {
    try {
      const ownerId = req.headers['x-user-id'] as string;
      const { leadId } = req.params;

      if (!ownerId) {
        return res.status(400).json({ success: false, error: 'Owner ID é obrigatório' });
      }

      // Buscar lead existente
      const existingLead = await this.prisma.leads.findFirst({
        where: {
          id: leadId,
          ownerId,
        },
      });

      if (!existingLead) {
        return res.status(404).json({ success: false, error: 'Lead não encontrado' });
      }

      // Deletar lead (as atividades relacionadas serão deletadas em cascata)
      await this.prisma.leads.delete({
        where: { id: leadId },
      });

      res.json({ success: true, message: 'Lead deletado com sucesso' });
    } catch (error: any) {
      logger.error('Erro ao deletar lead:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Buscar estatísticas de leads
  async getLeadsStats(req: Request, res: Response) {
    try {
      const ownerId = req.headers['x-user-id'] as string;

      if (!ownerId) {
        return res.status(400).json({ success: false, error: 'Owner ID é obrigatório' });
      }

      const stats = await this.prisma.leads.groupBy({
        by: ['status'],
        where: {
          ownerId,
        },
        _count: {
          status: true,
        },
      });

      const totalLeads = await this.prisma.leads.count({
        where: { ownerId },
      });

      const totalValue = await this.prisma.leads.aggregate({
        where: { ownerId },
        _sum: {
          value: true,
        },
      });

      res.json({
        success: true,
        data: {
          total: totalLeads,
          totalValue: totalValue._sum.value || 0,
          byStatus: stats.map(stat => ({
            status: stat.status,
            count: stat._count.status,
          })),
        },
      });
    } catch (error: any) {
      logger.error('Erro ao buscar estatísticas de leads:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
