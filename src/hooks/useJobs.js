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

      if (filters.dateFrom) query = query.gte("applied_date", filters.dateFrom);

      if (filters.dateTo) query = query.lte("applied_date", filters.dateTo);

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
// Fetches all attachments for a specific job
// Only runs when jobId is provided
export function useAttachments(jobId) {
  return useQuery({
    queryKey: ["attachments", jobId], // ← key is "attachments" not "job-attachments"
    enabled: !!jobId, // don't run if jobId is null/undefined
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_attachments") // ← table name uses underscore
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// ── useUploadAttachment ───────────────────────────────────────────────────────
export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, file }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const filePath = `${user.id}/${jobId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("job-attachments") // ← bucket name uses hyphen
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("job_attachments") // ← table name uses underscore
        .insert({
          job_id: jobId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: filePath,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Must match the queryKey in useAttachments above
      queryClient.invalidateQueries({ queryKey: ["attachments", data.job_id] });
      toast.success("File uploaded!");
    },
    onError: (error) => {
      toast.error("Upload failed: " + error.message);
    },
  });
}

// ── useDeleteAttachment ───────────────────────────────────────────────────────
export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attachment, jobId }) => {
      const { error: storageError } = await supabase.storage
        .from("job-attachments") // ← bucket name uses hyphen
        .remove([attachment.storage_path]);

      if (storageError) throw storageError;

      const { error } = await supabase
        .from("job_attachments") // ← table name uses underscore
        .delete()
        .eq("id", attachment.id);

      if (error) throw error;
      return jobId;
    },
    onSuccess: (jobId) => {
      // Must match the queryKey in useAttachments above
      queryClient.invalidateQueries({ queryKey: ["attachments", jobId] });
      toast.success("Attachment deleted.");
    },
    onError: (error) => {
      toast.error("Delete failed: " + error.message);
    },
  });
}
