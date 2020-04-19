import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryName: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    categoryName,
  }: Request): Promise<Transaction> {
    if (!(type === 'income' || type === 'outcome')) {
      throw new AppError('Invalid operation recieved', 401);
    }
    const categoryRepositoryInstance = getRepository(Category);
    const transactionRepositoryInstance = getCustomRepository(
      TransactionRepository,
    );
    const balance = await transactionRepositoryInstance.getBalance();

    if (type === 'outcome' && +balance.total - (+balance.outcome + value) < 0)
      throw new AppError('Invalid income to perform operation');

    let category = await categoryRepositoryInstance.findOne({
      where: { title: categoryName },
    });

    if (!category) {
      const newCategory = await categoryRepositoryInstance.create({
        title: categoryName,
      });
      category = await categoryRepositoryInstance.save(newCategory);
    }

    const transaction = await transactionRepositoryInstance.create({
      title,
      type,
      value: +value,
      category_id: category.id,
    });

    await transactionRepositoryInstance.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
