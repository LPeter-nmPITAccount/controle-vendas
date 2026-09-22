import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { UsuariosManager } from "./usuarios-manager";

export default async function UsuariosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Confere o próprio tipo antes de mostrar qualquer coisa. O RLS já impediria
  // um usuário comum de LER os dados de outros perfis, mas checar aqui também
  // evita a pessoa ver uma tela pela metade — é melhor avisar diretamente.
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("type, is_superadmin")
    .eq("id", user!.id)
    .single();

  if (myProfile?.type !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
        <ShieldAlert size={28} className="text-muted" />
        <p className="text-sm text-muted">Essa área é exclusiva para administradores.</p>
      </div>
    );
  }

  const { data: perfis } = await supabase
    .from("profiles")
    .select("id, name, type, is_active, is_superadmin")
    .order("name");

  return (
    <UsuariosManager
      initialPerfis={perfis ?? []}
      currentUserId={user!.id}
      currentUserIsSuperadmin={myProfile.is_superadmin}
    />
  );
}
