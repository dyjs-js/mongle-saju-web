import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyPayment } from "@/services/payment";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const { paymentId } = await request.json();
    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId가 필요합니다." },
        { status: 400 },
      );
    }

    // 포트원 서버에서 결제 검증 (클라이언트 위변조 방지)
    const { isValid, orderId, amount, error } = await verifyPayment(paymentId);

    if (!isValid) {
      await supabase.from("payments").insert({
        user_id: user.id,
        amount: 0,
        status: "failed",
        order_id: paymentId,
      });
      return NextResponse.json({ error }, { status: 400 });
    }

    // 결제 성공 기록
    await supabase.from("payments").insert({
      user_id: user.id,
      amount,
      status: "paid",
      order_id: orderId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/payment] 오류:", error);
    return NextResponse.json(
      { error: "결제 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
