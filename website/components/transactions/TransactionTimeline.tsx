"use client";

import TransactionCard, { Transaction } from "./TransactionCard";

interface Props {
  transactions: Transaction[];
  onSelectTransaction: (transaction: Transaction) => void;
}

export default function TransactionTimeline({
  transactions,
  onSelectTransaction,
}: Props) {
  const grouped = transactions.reduce((groups, transaction) => {
    const date = new Date(transaction.created_at);

    const today = new Date();

    const transactionDay = date.toDateString();
    const todayDay = today.toDateString();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let label = date.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    if (transactionDay === todayDay) {
      label = "Today";
    } else if (transactionDay === yesterday.toDateString()) {
      label = "Yesterday";
    }

    if (!groups[label]) {
      groups[label] = [];
    }

    groups[label].push(transaction);

    return groups;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            {date}
          </h2>

          <div className="space-y-4">
            {items.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onClick={() => onSelectTransaction(transaction)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}