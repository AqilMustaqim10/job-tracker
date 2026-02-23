import { useRef } from "react";
import {
  useAttachments,
  useUploadAttachment,
  useDeleteAttachment,
} from "../hooks/useJobs";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

// AttachmentsPanel shows all attachments for a job
// and lets the user upload new files or delete existing ones
export default function AttachmentsPanel({ jobId }) {
  const { data: attachments, isLoading } = useAttachments(jobId);
  const upload = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();

  // Hidden file input — we trigger it programmatically when the button is clicked
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    await upload.mutateAsync({ jobId, file });

    // Reset the input so the same file can be uploaded again if needed
    e.target.value = "";
  };

  const handleDelete = (attachment) => {
    toast("Delete this attachment?", {
      action: {
        label: "Delete",
        onClick: () => deleteAttachment.mutate({ attachment, jobId }),
      },
      cancel: { label: "Cancel" },
    });
  };

  // Get a public URL to view/download the file
  const getFileUrl = (storagePath) => {
    const { data } = supabase.storage
      .from("job-attachments")
      .getPublicUrl(storagePath);

    return data.publicUrl;
  };

  // Show a nice icon based on file type
  const getFileIcon = (fileType) => {
    if (!fileType) return "📄";
    if (fileType.includes("pdf")) return "📕";
    if (fileType.includes("image")) return "🖼️";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("sheet") || fileType.includes("excel")) return "📊";
    return "📄";
  };

  return (
    <div className="space-y-3">
      {/* Upload button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.xls"
        />

        <button
          onClick={() => fileInputRef.current.click()}
          disabled={upload.isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-white/[0.15] rounded-lg text-sm text-gray-400 hover:text-white hover:border-violet-500/50 hover:bg-violet-500/5 transition-all disabled:opacity-50"
        >
          {upload.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>↑ Upload File</>
          )}
        </button>

        <p className="text-xs text-gray-700 mt-1.5 text-center">
          PDF, Word, Excel, Images — max 10MB
        </p>
      </div>

      {/* Attachments list */}
      {isLoading ? (
        <p className="text-sm text-gray-600 text-center py-2">Loading...</p>
      ) : !attachments?.length ? (
        <p className="text-sm text-gray-600 italic text-center py-2">
          No attachments yet.
        </p>
      ) : (
        <div className="space-y-2">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg group"
            >
              {/* File type icon */}
              <span className="text-xl shrink-0">
                {getFileIcon(a.file_type)}
              </span>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{a.file_name}</p>
                <p className="text-xs text-gray-500">
                  {a.file_size ? `${(a.file_size / 1024).toFixed(1)} KB` : ""}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* View / Download button */}
                <a
                  href={getFileUrl(a.storage_path)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-md transition-colors text-xs"
                  title="View file"
                >
                  ↗
                </a>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(a)}
                  className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors text-xs"
                  title="Delete file"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
