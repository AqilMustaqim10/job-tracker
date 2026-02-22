import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

// ── useJobs ───────────────────────────────────────────────────────────────────
// Fetches all jobs from the database
// Accepts optional filters: { search, status }
// useQuery automatically handles loading/error states and caches the result
export function useJobs(filters = {}) {
  return useQuery({
    // queryKey is like an ID for this query
    // When filters changes, React Query automatically refetches
    queryKey: ["jobs", filters],

    queryFn: async () => {
      // Start building the query
      let query = supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false }); // newest first

      // If a status filter is set (and it's not "All"), filter by it
      if (filters.status && filters.status !== "All")
        query = query.eq("status", filters.status);

      // If a search term is set, search in both company name and job title
      if (filters.search)
        query = query.or(
          `company_name.ilike.%${filters.search}%,job_title.ilike.%${filters.search}%`,
        );

      const { data, error } = await query;

      // If Supabase returns an error, throw it so React Query catches it
      if (error) throw error;

      return data;
    },
  });
}

// ── useUpsertJob ──────────────────────────────────────────────────────────────
// Handles both CREATE (insert) and UPDATE
// If the job has an id → update it
// If no id → create a new one
export function useUpsertJob() {
  // useQueryClient lets us interact with the cache
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (job) => {
      // Get the currently logged in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Attach the user's id to the job so RLS knows who owns it
      const payload = { ...job, user_id: user?.id };

      // If job has an id, update the existing row
      // Otherwise insert a new row
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

    // After a successful save, tell React Query to refetch the jobs list
    // This makes the UI update automatically without a page refresh
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

// ── useDeleteJob ──────────────────────────────────────────────────────────────
// Deletes a job by its id
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },

    // Refetch jobs list after deletion so the row disappears from the UI
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

// ── useAttachments ────────────────────────────────────────────────────────────
// Fetches attachments for a specific job
// Only runs when a jobId is provided (enabled: !!jobId)
export function useAttachments(jobId) {
  return useQuery({
    queryKey: ["attachments", jobId],

    // Don't run this query if jobId is null/undefined
    // This prevents unnecessary requests when no job is selected
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
