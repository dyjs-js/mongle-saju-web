import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/user/settings — 닉네임 변경
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );

  const { name } = await request.json();
  if (!name || typeof name !== "string" || name.trim().length === 0)
    return NextResponse.json(
      { error: "닉네임을 입력해주세요." },
      { status: 400 },
    );
  if (name.trim().length > 20)
    return NextResponse.json(
      { error: "닉네임은 20자 이내로 입력해주세요." },
      { status: 400 },
    );

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    name: name.trim(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[API/user/settings PATCH]", error.message);
    return NextResponse.json(
      { error: "닉네임 변경에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/user/settings — 회원 탈퇴
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );

  // service_role 키가 없으면 admin.deleteUser 불가 → auth.admin 대신
  // RLS DELETE 정책으로 profiles/saju_results 는 cascade 삭제됨
  // auth.users 삭제는 Supabase Admin API 필요 → 여기서는 signOut + 프로필 삭제
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (profileError) {
    console.error("[API/user/settings DELETE] profile:", profileError.message);
  }

  // auth.users 행은 service_role로만 삭제 가능 — 서버 환경변수에 있으면 사용
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (serviceKey && supabaseUrl) {
    await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
      method: "DELETE",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}

// PUT /api/user/settings — 비밀번호 변경 (현재 비밀번호 확인 후 즉시 변경)
export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword)
    return NextResponse.json(
      { error: "비밀번호를 입력해주세요." },
      { status: 400 },
    );
  if (newPassword.length < 6)
    return NextResponse.json(
      { error: "새 비밀번호는 6자 이상이어야 해요." },
      { status: 400 },
    );

  // 1. 현재 비밀번호 확인 (재인증)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });
  if (signInError)
    return NextResponse.json(
      { error: "현재 비밀번호가 올바르지 않아요." },
      { status: 400 },
    );

  // 2. 새 비밀번호로 변경
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
