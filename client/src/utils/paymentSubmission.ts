export interface ProofFields { amount: string; paymentType: string; datePaid: string; remarks: string; proof: File }

export function localPaymentDate(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function paymentFormData(tenantId: string, landlordId: string, fields: ProofFields) {
    const data = new FormData();
    data.append('tenantId', tenantId);
    data.append('landlordId', landlordId);
    data.append('amount', fields.amount);
    data.append('paymentType', fields.paymentType);
    data.append('datePaid', fields.datePaid);
    data.append('remarks', fields.remarks);
    data.append('proof', fields.proof);
    return data;
}

