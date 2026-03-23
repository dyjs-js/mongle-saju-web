export const PAYMENT_AMOUNT = 990; // 원

/**
 * 포트원 v2 결제 검증
 * 클라이언트에서 결제 완료 후 paymentId를 받아 서버에서 검증
 */
export async function verifyPayment(paymentId: string): Promise<{
  isValid: boolean;
  orderId?: string;
  amount?: number;
  error?: string;
}> {
  try {
    const response = await fetch(
      `https://api.portone.io/payments/${paymentId}`,
      {
        headers: {
          Authorization: `PortOne ${process.env.PORTONE_API_SECRET}`,
        },
      },
    );

    if (!response.ok) {
      return { isValid: false, error: "결제 정보 조회 실패" };
    }

    const payment = await response.json();

    // 결제 상태 및 금액 검증
    if (payment.status !== "PAID") {
      return { isValid: false, error: "결제가 완료되지 않았습니다." };
    }

    if (payment.amount.total !== PAYMENT_AMOUNT) {
      return { isValid: false, error: "결제 금액이 일치하지 않습니다." };
    }

    return {
      isValid: true,
      orderId: payment.merchantPaymentId,
      amount: payment.amount.total,
    };
  } catch (error) {
    console.error("[Payment] 검증 오류:", error);
    return { isValid: false, error: "결제 검증 중 오류가 발생했습니다." };
  }
}
