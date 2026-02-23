import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

// ── useJobs ───────────────────────────────────────────────────────────────────
export function useJobs(filters = {}) {
  return useQuery({
    queryKey: ["jobs", filters],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters.status && filters.status !== "All")
        query = query.eq("status", filters.status);

      if (filters.search)
        query = query.or(
          `company_name.ilike.%${filters.search}%,job_title.ilike.%${filters.search}%`,
        );

      // Filter by applied_date range if either date is set
      if (filters.dateFrom) query = query.gte("applied_date", filters.dateFrom); // greater than or equal

      if (filters.dateTo) query = query.lte("applied_date", filters.dateTo); // less than or equal

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// ── useUpsertJob ──────────────────────────────────────────────────────────────
export function useUpsertJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (job) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const payload = { ...job, user_id: user?.id };

      const { data, error } = job.id
        ? await supabase
            .from("jobs")
            .update(payload)
            .eq("id", job.id)
            .select()
            .single()
        : await supabase.from("jobs").insert(payload).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      variables.id
        ? toast.success("Job updated successfully!")
        : toast.success("Job added successfully!");
    },
    onError: (error) => {
      toast.error("Failed to save job: " + error.message);
    },
  });
}

// ── useDeleteJob ──────────────────────────────────────────────────────────────
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job deleted.");
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });
}

// ── useAttachments ────────────────────────────────────────────────────────────
export function useAttachments(jobId) {
  return useQuery({
    queryKey: ["attachments", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_attachments")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
