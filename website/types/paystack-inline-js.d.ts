declare module "@paystack/inline-js" {
  type PaystackSuccessResponse = {
    reference: string;
    trans?: string;
    status?: string;
    message?: string;
    transaction?: string;
    trxref?: string;
  };

  type PaystackCallbacks = {
    onSuccess?: (
      transaction: PaystackSuccessResponse
    ) => void | Promise<void>;

    onCancel?: () => void;

    onError?: (
      error: Error
    ) => void;
  };

  export default class PaystackPop {
    resumeTransaction(
      accessCode: string,
      callbacks?: PaystackCallbacks
    ): void;
  }
}