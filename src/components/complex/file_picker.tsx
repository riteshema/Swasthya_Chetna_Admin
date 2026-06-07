"use client";

import {
  type ChangeEventHandler,
  Fragment,
  type JSX,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import Image from "next/image";
import { FileUpIcon, Trash2Icon } from "lucide-react";
import { compute_mime_type, type MIMECategory } from "@lib/utils";
import { Button } from "@components/ui/button";
import { v4 as uuid } from "uuid";

interface FilePickerValueEntry {
  id: string;
  url: string;
  mime: MIMECategory;
}

/**
 * file === undefined -> existing remote file
 * file instanceof File -> newly added file
 */
export interface FilePickerChangeEntry {
  id: string;
  file?: File;
  mime: MIMECategory;
}

interface FilePickerProps {
  title?: string;
  description?: string;
  maxFiles?: number;
  randomizeFileName?: boolean;
  accept: string;
  multiple?: boolean;
  error?: string;
  /** optional existing entries provided by parent. Component will NOT compute mime for these (caller must provide). */
  value?: Array<FilePickerValueEntry>;
  /**
   * Emits whenever the preview set changes (files added, removed, or value prop changed).
   * Payload is a snapshot of current previews: Array<{id, file?: File, mime}>
   */
  onChange: (files: Array<FilePickerChangeEntry>) => void;
  /** If false, delete button is hidden for `value` (existing) items. Defaults to true. */
  allowDeletingExistingValues?: boolean;
}

export function file_to_data_url(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reader.abort();
      reject(new Error("File read error"));
    };

    reader.onprogress = (ev: ProgressEvent<FileReader>) => {
      if (ev.lengthComputable && onProgress) {
        const pct = Math.round((ev.loaded / ev.total) * 100);
        onProgress(pct);
      }
    };

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Unexpected result from FileReader"));
      }
    };

    reader.readAsDataURL(file);
  });
}

type PreviewEntry = {
  id: string;
  url: string;
  file: File | null;
  mime: MIMECategory;
  isExisting: boolean;
};

export default function FilePicker({
  title,
  description,
  maxFiles = 1,
  accept,
  multiple,
  value,
  onChange,
  randomizeFileName = false,
  error,
  allowDeletingExistingValues = true,
}: Readonly<FilePickerProps>): JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const user_touched_ref=useRef(false);
  const infer_mime_from = useCallback(
    (file: File | null, url?: string): MIMECategory => {
      if (file?.type) {
        return compute_mime_type(file.type);
      }
      if (!url) {
        return compute_mime_type(accept);
      }
      if (url.startsWith("data:")) {
        const after = url.slice(5);
        const media = after.split(";")[0] ?? "";
        if (media) {
          return compute_mime_type(media);
        }
      }
      const cleaned = url.split(/[?#]/)[0];
      const parts = cleaned.split(".");
      if (parts.length > 1) {
        const ext = parts.pop()?.toLowerCase();
        if (ext && ext.length <= 8) {
          return compute_mime_type(`.${ext}`);
        }
      }
      return compute_mime_type(accept);
    },
    [accept],
  );

  // eslint-disable-next-line @eslint-react/use-state
  const [file_previews, update_file_previews] = useState<PreviewEntry[]>(() =>
    (value ?? []).map((v) => ({
      id: v.id,
      url: v.url,
      file: null,
      mime: v.mime,
      isExisting: true,
    })),
  );

  const emit_change = useCallback(
    (entries: PreviewEntry[]) => {
      const payload: FilePickerChangeEntry[] = entries.map((e) => ({
        id: e.id,
        file: e.file ?? undefined,
        mime: e.mime,
      }));
      onChange(payload);
    },
    [onChange],
  );

  useEffect(() => {
    if (!value || user_touched_ref.current) {
      return;
    }

    // eslint-disable-next-line @eslint-react/set-state-in-effect
    update_file_previews((prev) => {
      const uploaded = prev.filter((p) => !p.isExisting);

      const existing = value.map((v) => ({
        id: v.id,
        url: v.url,
        file: null,
        mime: v.mime,
        isExisting: true,
      }));

      return [...existing, ...uploaded].slice(0, maxFiles);
    });
  }, [value, maxFiles]);

  const on_input_changed = useCallback<ChangeEventHandler<HTMLInputElement>>(
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (event) => {
      const picked_files = Array.from(event.target.files ?? []);
      if (picked_files.length === 0) {
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        return;
      }

      const tasks = picked_files.map(async (file) => {
        const id = uuid();
        const parts = file.name.split(".");
        const ext = parts.length > 1 ? `.${parts.pop()}` : "";
        const mutated_file = randomizeFileName
          ? new File([file], `${id}${ext}`, {
              type: file.type,
              lastModified: file.lastModified,
            })
          : file;
        const url = await file_to_data_url(mutated_file);
        const mime = infer_mime_from(mutated_file, url);
        return {
          id,
          url,
          file: mutated_file,
          mime,
          isExisting: false,
        };
      });

      const new_entries = await Promise.all(tasks);

      update_file_previews((prev) => {
        const next = [...prev, ...new_entries].slice(0, maxFiles);
        emit_change(next);
        return next;
      });

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [emit_change, infer_mime_from, maxFiles, randomizeFileName],
  );

  const handle_remove_at_index = useCallback(
    (index: number) => {
      user_touched_ref.current=true;
      update_file_previews((prev) => {
        const next = prev.filter((_, i) => i !== index);
        emit_change(next);
        return next;
      });
    },
    [emit_change],
  );

  return (
    <Card className={error ? "border-destructive" : ""}>
      <CardHeader>
        <CardTitle
          hidden={title === undefined || title.trim().length === 0}
          className={error ? "text-destructive" : ""}
        >
          {title}
        </CardTitle>
        <p
          hidden={description === undefined || description.trim().length === 0}
          className={"text-muted-foreground text-xs"}
        >
          {description}
        </p>
      </CardHeader>

      <CardContent className={"space-y-3"}>
        <div
          hidden={file_previews.length >= maxFiles}
          role={"button"}
          className={`text-muted-foreground hover:bg-secondary/30 flex cursor-pointer flex-col items-center justify-center space-y-2 rounded-md border-2 border-dotted py-5 select-none`}
          onClick={() => {
            inputRef.current?.click();
          }}
        >
          <FileUpIcon className={"size-6"} />
          <p className={"text-[0.9rem] font-medium"}>
            Click here to add files.
          </p>
          <span className={"text-xs"}>
            {Math.max(0, maxFiles - file_previews.length)} slots remaining.
          </span>

          <input
            ref={inputRef}
            type={"file"}
            multiple={multiple}
            accept={accept}
            hidden={true}
            className={"invisible"}
            onChange={on_input_changed}
          />
        </div>

        <div>
          <span className={"text-muted-foreground text-[0.8rem]"}>
            Preview(s)
          </span>
          <div>
            {file_previews.length === 0 ? (
              <span
                className={
                  "text-muted-foreground inline-block w-full text-center text-xs"
                }
              >
                No file(s) chosen.
              </span>
            ) : (
              <div className={"flex flex-col space-y-3 py-2"}>
                {file_previews.map((preview, index) => {
                  const can_delete = !(
                    preview.isExisting && !allowDeletingExistingValues
                  );

                  return (
                    <div
                      key={preview.id}
                      className={"flex items-center justify-between space-x-3"}
                    >
                      {preview.mime === "image" ? (
                        <Image
                          src={preview.url}
                          width={200}
                          height={200}
                          alt={`File ${index + 1}`}
                          className={"h-20 w-auto"}
                        />
                      ) : preview.mime === "audio" ? (
                        <audio controls className={"flex-1"}>
                          <source src={preview.url} />
                        </audio>
                      ) : preview.mime === "video" ? (
                        <div className="flex-1">
                          <video controls className="h-48 w-full">
                            <source src={preview.url} />
                            Your browser does not support the video element.
                          </video>
                        </div>
                      ) : preview.mime === "pdf" ? (
                        <div className="flex-1">
                          <iframe
                            title={`PDF preview ${index + 1}`}
                            src={preview.url}
                            className="h-48 w-full border"
                          />
                        </div>
                      ) : preview.mime === "doc" || preview.mime === "docx" ? (
                        <div className="flex-1 wrap-break-word">
                          <div className="text-sm font-medium">
                            {preview.file?.name ?? "Document"}
                          </div>
                          <a
                            href={preview.url}
                            download={preview.file?.name}
                            className="text-muted-foreground text-xs underline"
                          >
                            Download
                          </a>
                        </div>
                      ) : (
                        <div className="flex-1 wrap-break-word">
                          <div className="text-sm font-medium">
                            {preview.file?.name ?? `File ${index + 1}`}
                          </div>
                          <a
                            href={preview.url}
                            download={preview.file?.name}
                            className="text-muted-foreground text-xs underline"
                          >
                            Download
                          </a>
                        </div>
                      )}

                      {can_delete ? (
                        <Button
                          type={"button"}
                          size={"sm"}
                          variant={"ghost"}
                          onClick={() => {
                            if (
                              preview.isExisting &&
                              !allowDeletingExistingValues
                            ) {
                              return;
                            }
                            handle_remove_at_index(index);
                          }}
                        >
                          <Trash2Icon />
                        </Button>
                      ) : (
                        <Fragment />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <p
          className={`text-destructive mt-1 h-3 text-xs ${error ? "visible" : "invisible"}`}
          aria-live="polite"
        >
          {error ?? "placeholder"}
        </p>
      </CardFooter>
    </Card>
  );
}
