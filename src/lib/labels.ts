export const salesStatusLabels: Record<string, string> = {
  inquiry: "Обращение",
  inspection: "Осмотр",
  estimate_draft: "Смета (черновик)",
  pending_approval: "Ожидает согласования",
  approved: "Согласовано",
  lost: "Потерян",
};

export const productionStatusLabels: Record<string, string> = {
  intake: "Приёмка",
  in_progress: "В работе",
  waiting_parts: "Ожидание запчастей",
  qc: "ОТК",
  ready_for_release: "Готов к выдаче",
  released: "Выдан",
};

export const operationStatusLabels: Record<string, string> = {
  assigned: "Назначена",
  in_progress: "В работе",
  on_review: "На проверке",
  completed: "Выполнена",
};

export function formatRub(amount: string | number) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n || 0);
}
