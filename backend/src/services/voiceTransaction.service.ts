import { randomUUID } from 'crypto';
import { Account } from '../models/Account';
import { TransactionService } from './transaction.service';
import { TransactionType, IncomeCategory, ExpenseCategory } from '../types/models.types';
import { AccountType } from '../types/models.types';

export interface VoiceTransactionParsedData {
  type: TransactionType;
  amount: number;
  description: string;
  category: IncomeCategory | ExpenseCategory;
  accountId?: string;
  confidence: number;
  alternatives?: Array<{
    type: TransactionType;
    category: IncomeCategory | ExpenseCategory;
    confidence: number;
  }>;
}

export interface VoiceTransactionConfirmation {
  message: string;
  data: VoiceTransactionParsedData;
  suggestedAccount: {
    id: string;
    name: string;
    type: AccountType;
  } | null;
  needsConfirmation: boolean;
}

export class VoiceTransactionService {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  /**
   * Parse voice input text into transaction data
   */
  async parseVoiceInput(
    text: string,
    userId: string
  ): Promise<VoiceTransactionConfirmation> {
    try {
      const normalizedText = text.toLowerCase().trim();

      // Parse the voice input
      const parsedData = this.parseTransaction(normalizedText);

      if (!parsedData) {
        throw new Error(
          'Could not understand the transaction. Please try again with format like: "I spent 500 rupees on groceries" or "I received 5000 rupees salary"'
        );
      }

      // Get suggested account
      const suggestedAccount = await this.getSuggestedAccount(userId, parsedData.type);

      if (suggestedAccount) {
        parsedData.accountId = suggestedAccount.id;
      }

      // Generate confirmation message
      const confirmationMessage = this.generateConfirmationMessage(parsedData, suggestedAccount);

      return {
        message: confirmationMessage,
        data: parsedData,
        suggestedAccount,
        needsConfirmation: true,
      };
    } catch (error: any) {
      throw new Error(`Failed to parse voice input: ${error.message}`);
    }
  }

  /**
   * Parse transaction from text
   */
  private parseTransaction(text: string): VoiceTransactionParsedData | null {
    // Expense patterns
    const expensePatterns = [
      // "I spent 500 rupees on groceries"
      /(?:i\s+)?(?:spent|paid)\s+(?:rupees\s+)?(\d+)\s+(?:rupees|rs|inr)?\s+(?:on|for)\s+(.+)/i,
      // "500 rupees spent on groceries"
      /(\d+)\s+(?:rupees|rs|inr)?\s+(?:spent|paid)\s+(?:on|for)\s+(.+)/i,
      // "Paid 1200 for electricity bill"
      /(?:paid|spent)\s+(\d+)\s+(?:for|on)\s+(.+)/i,
    ];

    // Income patterns
    const incomePatterns = [
      // "I received 5000 rupees salary"
      /(?:i\s+)?(?:received|got|earned)\s+(?:rupees\s+)?(\d+)\s+(?:rupees|rs|inr)?\s+(?:from|as|for)?\s*(.+)?/i,
      // "5000 rupees received as salary"
      /(\d+)\s+(?:rupees|rs|inr)?\s+(?:received|got)\s+(?:as|from|for)?\s*(.+)?/i,
      // "Got 2000 rupees allowance"
      /(?:got|received)\s+(\d+)\s+(?:rupees|rs|inr)?\s+(.+)?/i,
    ];

    // Try to match expense patterns
    for (const pattern of expensePatterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseInt(match[1]);
        const description = match[2].trim();
        const category = this.inferExpenseCategory(description);
        const alternatives = this.getAlternativeExpenseCategories(description);

        return {
          type: TransactionType.EXPENSE,
          amount,
          description: this.cleanDescription(description),
          category,
          confidence: this.calculateConfidence(description, category),
          alternatives,
        };
      }
    }

    // Try to match income patterns
    for (const pattern of incomePatterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseInt(match[1]);
        const description = match[2]?.trim() || 'Income';
        const category = this.inferIncomeCategory(description);
        const alternatives = this.getAlternativeIncomeCategories(description);

        return {
          type: TransactionType.INCOME,
          amount,
          description: this.cleanDescription(description),
          category,
          confidence: this.calculateConfidence(description, category),
          alternatives,
        };
      }
    }

    return null;
  }

  /**
   * Infer expense category from description
   */
  private inferExpenseCategory(description: string): ExpenseCategory {
    const text = description.toLowerCase();

    const categoryKeywords: Record<ExpenseCategory, string[]> = {
      [ExpenseCategory.GROCERIES]: [
        'grocery',
        'groceries',
        'vegetables',
        'fruits',
        'food items',
        'supermarket',
        'market',
        'sabzi',
        'kirana',
      ],
      [ExpenseCategory.FOOD_DINING]: [
        'restaurant',
        'food',
        'dinner',
        'lunch',
        'breakfast',
        'snacks',
        'pizza',
        'burger',
        'cafe',
        'coffee',
        'tea',
        'eating',
        'meal',
      ],
      [ExpenseCategory.TRANSPORTATION]: [
        'petrol',
        'diesel',
        'fuel',
        'bus',
        'auto',
        'taxi',
        'uber',
        'ola',
        'rapido',
        'metro',
        'train',
        'transport',
        'travel',
      ],
      [ExpenseCategory.HEALTH]: [
        'medicine',
        'medical',
        'doctor',
        'hospital',
        'clinic',
        'pharmacy',
        'chemist',
        'health',
        'treatment',
        'checkup',
      ],
      [ExpenseCategory.EDUCATION]: [
        'school',
        'college',
        'university',
        'books',
        'tuition',
        'course',
        'class',
        'fees',
        'education',
        'study',
      ],
      [ExpenseCategory.OTHER_EXPENSE]: [],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return category as ExpenseCategory;
      }
    }

    return ExpenseCategory.OTHER_EXPENSE;
  }

  /**
   * Infer income category from description
   */
  private inferIncomeCategory(description: string): IncomeCategory {
    const text = description.toLowerCase();

    const categoryKeywords: Record<IncomeCategory, string[]> = {
      [IncomeCategory.SALARY]: [
        'salary',
        'wage',
        'income',
        'pay',
        'payment',
        'paycheck',
        'monthly income',
      ],
      [IncomeCategory.BUSINESS]: [
        'business',
        'profit',
        'sales',
        'revenue',
        'client payment',
        'invoice',
      ],
      [IncomeCategory.ALLOWANCE]: [
        'allowance',
        'pocket money',
        'gift',
        'bonus',
        'incentive',
      ],
      [IncomeCategory.OTHER_INCOME]: [],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return category as IncomeCategory;
      }
    }

    return IncomeCategory.OTHER_INCOME;
  }

  /**
   * Get alternative expense categories
   */
  private getAlternativeExpenseCategories(description: string): Array<{
    type: TransactionType;
    category: ExpenseCategory;
    confidence: number;
  }> {
    const alternatives: Array<{
      type: TransactionType;
      category: ExpenseCategory;
      confidence: number;
    }> = [];

    const categories = Object.values(ExpenseCategory);

    for (const category of categories) {
      const confidence = this.calculateConfidence(description, category);
      if (confidence > 30) {
        alternatives.push({
          type: TransactionType.EXPENSE,
          category,
          confidence,
        });
      }
    }

    return alternatives.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  /**
   * Get alternative income categories
   */
  private getAlternativeIncomeCategories(description: string): Array<{
    type: TransactionType;
    category: IncomeCategory;
    confidence: number;
  }> {
    const alternatives: Array<{
      type: TransactionType;
      category: IncomeCategory;
      confidence: number;
    }> = [];

    const categories = Object.values(IncomeCategory);

    for (const category of categories) {
      const confidence = this.calculateConfidence(description, category);
      if (confidence > 30) {
        alternatives.push({
          type: TransactionType.INCOME,
          category,
          confidence,
        });
      }
    }

    return alternatives.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  /**
   * Calculate confidence score for category inference
   */
  private calculateConfidence(description: string, category: string): number {
    const text = description.toLowerCase();
    let keywords: string[] = [];

    if (Object.values(ExpenseCategory).includes(category as ExpenseCategory)) {
      const expenseCat = category as ExpenseCategory;
      keywords = this.getExpenseKeywords(expenseCat);
    } else if (Object.values(IncomeCategory).includes(category as IncomeCategory)) {
      const incomeCat = category as IncomeCategory;
      keywords = this.getIncomeKeywords(incomeCat);
    }

    const matches = keywords.filter((keyword) => text.includes(keyword)).length;

    if (matches === 0) return 40;
    if (matches === 1) return 70;
    if (matches >= 2) return 95;

    return 40;
  }

  /**
   * Get keywords for expense category
   */
  private getExpenseKeywords(category: ExpenseCategory): string[] {
    const keywords: Record<ExpenseCategory, string[]> = {
      [ExpenseCategory.GROCERIES]: ['grocery', 'vegetables', 'fruits', 'market'],
      [ExpenseCategory.FOOD_DINING]: ['restaurant', 'food', 'dinner', 'lunch', 'cafe'],
      [ExpenseCategory.TRANSPORTATION]: ['petrol', 'fuel', 'taxi', 'uber', 'bus'],
      [ExpenseCategory.HEALTH]: ['medicine', 'doctor', 'hospital', 'medical'],
      [ExpenseCategory.EDUCATION]: ['school', 'books', 'tuition', 'fees'],
      [ExpenseCategory.OTHER_EXPENSE]: [],
    };

    return keywords[category] || [];
  }

  /**
   * Get keywords for income category
   */
  private getIncomeKeywords(category: IncomeCategory): string[] {
    const keywords: Record<IncomeCategory, string[]> = {
      [IncomeCategory.SALARY]: ['salary', 'wage', 'pay'],
      [IncomeCategory.BUSINESS]: ['business', 'profit', 'sales'],
      [IncomeCategory.ALLOWANCE]: ['allowance', 'gift', 'bonus'],
      [IncomeCategory.OTHER_INCOME]: [],
    };

    return keywords[category] || [];
  }

  /**
   * Clean description text
   */
  private cleanDescription(description: string): string {
    const cleaned = description
      .replace(/\b(rupees|rs|inr)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  /**
   * Get suggested account based on transaction type
   */
  private async getSuggestedAccount(
    userId: string,
    transactionType: TransactionType
  ): Promise<{ id: string; name: string; type: AccountType } | null> {
    try {
      let suggestedType: AccountType;

      if (transactionType === TransactionType.INCOME) {
        suggestedType = AccountType.BANK;
      } else {
        suggestedType = AccountType.CASH;
      }

      let account = await Account.findOne({
        userId,
        type: suggestedType,
        isActive: true,
      }).sort({ balance: -1 });

      if (!account) {
        account = await Account.findOne({
          userId,
          isActive: true,
        }).sort({ balance: -1 });
      }

      if (!account) {
        return null;
      }

      return {
        id: account._id.toString(),
        name: account.name,
        type: account.type,
      };
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Generate confirmation message
   */
  private generateConfirmationMessage(
    data: VoiceTransactionParsedData,
    suggestedAccount: { id: string; name: string; type: AccountType } | null
  ): string {
    const action = data.type === TransactionType.EXPENSE ? 'spent' : 'received';
    const preposition = data.type === TransactionType.EXPENSE ? 'on' : 'from';

    let message = `I understood: You ${action} ₹${data.amount} ${preposition} ${data.description}`;

    if (suggestedAccount) {
      message += ` using ${suggestedAccount.name}`;
    }

    message += `. Is this correct?`;

    return message;
  }

  /**
   * Create transaction from confirmed voice input
   */
  async createFromVoiceInput(
    userId: string,
    data: VoiceTransactionParsedData,
    accountId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<any> {
    try {
      const transactionData: any = {
        type: data.type,
        amount: data.amount,
        description: data.description,
        accountId,
        date: new Date().toISOString(),
      };

      if (data.type === TransactionType.INCOME) {
        transactionData.incomeCategory = data.category;
      } else if (data.type === TransactionType.EXPENSE) {
        transactionData.expenseCategory = data.category;
      }

      return await this.transactionService.createTransaction(
        userId,
        transactionData,
        ipAddress,
        userAgent
      );
    } catch (error: any) {
      throw new Error(`Failed to create transaction from voice input: ${error.message}`);
    }
  }

  /**
   * Get voice command suggestions
   */
  getVoiceCommandExamples(): string[] {
    return [
      'I spent 500 rupees on groceries',
      'I received 5000 rupees salary',
      'Paid 1200 for electricity bill',
      'Got 2000 rupees allowance',
      'Spent 150 rupees on coffee',
      'Received 10000 rupees from business',
      'Paid 50 rupees for auto',
      'Spent 800 rupees on medicines',
      'Got 3000 rupees bonus',
      'Paid 200 rupees for lunch',
    ];
  }
  }
