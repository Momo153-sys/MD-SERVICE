import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/domain";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function useRole() {
  const { user, loading } = useSession();
  const query = useQuery({
    queryKey: ["role", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AppRole | null> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      const roles = (data ?? []).map((r) => r.role as AppRole);
      const priority: AppRole[] = ["ADMIN", "COUNSELOR", "AGENT", "STUDENT"];
      return priority.find((p) => roles.includes(p)) ?? null;
    },
  });

  const role = query.data ?? null;
  return {
    role,
    user,
    loading: loading || query.isLoading,
    isStaff: role === "ADMIN" || role === "COUNSELOR",
    isAdmin: role === "ADMIN",
  };
}
