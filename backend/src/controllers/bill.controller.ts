import { FastifyRequest, FastifyReply } from 'fastify';
import { BillService } from '../services/bill.service';
import {
  CreateBillInput,
  UpdateBillInput,
  MarkBillAsPaidInput,
} from '../schemas/bill.schema';
import { BillQueryParams } from '../types/query.types';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter';

export class BillController {
  private billService: BillService;

  constructor() {
    this.billService = new BillService();
  }

  /**
   * Create a new bill
   */
  async createBill(
    request: FastifyRequest<{ Body: CreateBillInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const data = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const bill = await this.billService.createBill(userId, data, ipAddress, userAgent);

      reply.status(201).send(successResponse(bill, 'Bill created successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get bill payment approval
   */
  async getBillPaymentApproval(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const billId = request.params.id;

      const approval = await this.billService.getBillPaymentApproval(userId, billId);

      reply.status(200).send(successResponse(approval));
    } catch (error: any) {
      request.log.error(error);
      reply.status(404).send(errorResponse(error.message));
    }
  }

  /**
   * Mark bill as paid
   */
  async markAsPaid(
    request: FastifyRequest<{ Params: { id: string }; Body: MarkBillAsPaidInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const billId = request.params.id;
      const data = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const result = await this.billService.markAsPaid(
        userId,
        billId,
        data,
        ipAddress,
        userAgent
      );

      reply.status(200).send(
        successResponse(
          {
            bill: result.bill,
            transaction: result.transaction,
          },
          'Bill marked as paid successfully'
        )
      );
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get bills with filters
   */
  async getBills(
    request: FastifyRequest<{ Querystring: BillQueryParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const filters = {
        status: request.query.status,
        startDate: request.query.startDate,
        endDate: request.query.endDate,
        page: request.query.page ? parseInt(request.query.page) : 1,
        limit: request.query.limit ? parseInt(request.query.limit) : 20,
      };

      const result = await this.billService.getBills(userId, filters);

      reply.status(200).send(
        paginatedResponse(result.bills, result.page, result.limit, result.total)
      );
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get upcoming bills
   */
  async getUpcomingBills(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user.userId;

      const bills = await this.billService.getUpcomingBills(userId);

      reply.status(200).send(successResponse(bills));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get bill by ID
   */
  async getBillById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const billId = request.params.id;

      const bill = await this.billService.getBillById(userId, billId);

      reply.status(200).send(successResponse(bill));
    } catch (error: any) {
      request.log.error(error);
      reply.status(404).send(errorResponse(error.message));
    }
  }

  /**
   * Update bill
   */
  async updateBill(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateBillInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const billId = request.params.id;
      const data = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const bill = await this.billService.updateBill(
        userId,
        billId,
        data,
        ipAddress,
        userAgent
      );

      reply.status(200).send(successResponse(bill, 'Bill updated successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Delete bill
   */
  async deleteBill(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const billId = request.params.id;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      await this.billService.deleteBill(userId, billId, ipAddress, userAgent);

      reply.status(200).send(successResponse(null, 'Bill deleted successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }
}
