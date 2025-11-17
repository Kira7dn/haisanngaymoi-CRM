import { CustomerRepository } from '@/infrastructure/repositories/customer-repo';
import type { CustomerService } from '@/core/application/interfaces/customer-service';
import { GetAllCustomersUseCase } from '@/core/application/usecases/customer/get-all-customers';
import { CreateCustomerUseCase } from '@/core/application/usecases/customer/create-customer';
import { GetCustomerByIdUseCase } from '@/core/application/usecases/customer/get-customer-by-id';
import { UpdateCustomerUseCase } from '@/core/application/usecases/customer/update-customer';
import { DeleteCustomerUseCase } from '@/core/application/usecases/customer/delete-customer';
import { SearchCustomersByNameUseCase } from '@/core/application/usecases/customer/search-customers-by-name';

// Get CustomerRepository instance
const createCustomerRepository = async (): Promise<CustomerService> => {
  return new CustomerRepository();
};

// Create use case instances
export const getAllCustomersUseCase = async () => {
  const customerService = await createCustomerRepository();
  return new GetAllCustomersUseCase(customerService);
};

export const createCustomerUseCase = async () => {
  const customerService = await createCustomerRepository();
  return new CreateCustomerUseCase(customerService);
};

export const getCustomerByIdUseCase = async () => {
  const customerService = await createCustomerRepository();
  return new GetCustomerByIdUseCase(customerService);
};

export const updateCustomerUseCase = async () => {
  const customerService = await createCustomerRepository();
  return new UpdateCustomerUseCase(customerService);
};

export const deleteCustomerUseCase = async () => {
  const customerService = await createCustomerRepository();
  return new DeleteCustomerUseCase(customerService);
};

export const searchCustomersByNameUseCase = async () => {
  const customerService = await createCustomerRepository();
  return new SearchCustomersByNameUseCase(customerService);
};
