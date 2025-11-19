import { TicketRepository } from "@/infrastructure/repositories/customer-care/ticket-repo";
import { CreateTicketUseCase } from "@/core/application/usecases/customer-care/ticket/create-ticket";
import { GetTicketsUseCase } from "@/core/application/usecases/customer-care/ticket/get-tickets";
import { GetTicketByIdUseCase } from "@/core/application/usecases/customer-care/ticket/get-ticket-by-id";
import { UpdateTicketUseCase } from "@/core/application/usecases/customer-care/ticket/update-ticket";
import { AssignTicketUseCase } from "@/core/application/usecases/customer-care/ticket/assign-ticket";
import { ResolveTicketUseCase } from "@/core/application/usecases/customer-care/ticket/resolve-ticket";
import { AddTicketCommentUseCase } from "@/core/application/usecases/customer-care/ticket/add-comment";
import type { TicketService } from "@/core/application/interfaces/customer-care/ticket-service";

/**
 * Factory function to create ticket repository instance
 */
const createTicketRepository = async (): Promise<TicketService> => {
  return new TicketRepository();
};

/**
 * Use case factories
 */
export const createTicketUseCase = async () => {
  const service = await createTicketRepository();
  return new CreateTicketUseCase(service);
};

export const getTicketsUseCase = async () => {
  const service = await createTicketRepository();
  return new GetTicketsUseCase(service);
};

export const getTicketByIdUseCase = async () => {
  const service = await createTicketRepository();
  return new GetTicketByIdUseCase(service);
};

export const updateTicketUseCase = async () => {
  const service = await createTicketRepository();
  return new UpdateTicketUseCase(service);
};

export const assignTicketUseCase = async () => {
  const service = await createTicketRepository();
  return new AssignTicketUseCase(service);
};

export const resolveTicketUseCase = async () => {
  const service = await createTicketRepository();
  return new ResolveTicketUseCase(service);
};

export const addTicketCommentUseCase = async () => {
  const service = await createTicketRepository();
  return new AddTicketCommentUseCase(service);
};
