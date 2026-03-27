import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("saju_results")
    .select("id, category, content, input_snapshot, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results: data ?? [] });
}

export async function DELETE(request: Request) {
  // 1. 세션 확인 (본인인지 검증)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }

  // 2. service_role로 RLS bypass 삭제 (본인 데이터인지 user_id로 재확인)
  const admin = createServiceClient();
  const { error } = await admin
    .from("saju_results")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // 본인 데이터만 삭제 가능

  if (error) {
    console.error("[DELETE /api/my/results]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
