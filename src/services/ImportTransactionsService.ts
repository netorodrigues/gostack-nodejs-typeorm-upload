/* eslint-disable no-plusplus */
import parse from 'csv-parse/lib/sync';
import fs from 'fs';
import path from 'path';
import { getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import TransactionsRepository from '../repositories/TransactionsRepository';

import CreateTransactionService from './CreateTransactionService';

interface Request {
  filename: string;
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const filePath = path.resolve(uploadConfig.directory, filename);
    const file = fs.readFileSync(filePath, 'utf8');

    const transactions: Transaction[] = [];
    const records = parse(file, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const service = new CreateTransactionService();
      // eslint-disable-next-line no-await-in-loop
      const transaction = await service.execute({
        title: record.title,
        type: record.type,
        value: +record.value,
        categoryName: record.category,
      });
      transactions.push(transaction);
    }

    await transactionRepository.save(transactions);

    return transactions;
  }
}

export default ImportTransactionsService;
