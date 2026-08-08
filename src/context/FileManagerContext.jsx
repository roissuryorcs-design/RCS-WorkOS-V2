import { createContext, useState, useContext, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./AuthContext";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";

const FileManagerContext = createContext();

// Same double-JSON-encoding quirk as FileAttachment.jsx's parseFilesValue —
// a "files" column's value in items.fields is a JSON-stringified array, not
// native JSONB, because it flows through the same generic fields-patch path
// every other column type uses.
function parseFilesValue(value) {
  try {
    return value ? JSON.parse(value) : [];
  } catch {
    return value ? [{ url: value, name: value.split("/").pop() || "file" }] : [];
  }
}

function mapFolder(row) {
  return { id: row.id, boardId: row.board_id, parentId: row.parent_id, name: row.name, position: row.position };
}

function mapClaim(row) {
  return {
    id: row.id,
    boardId: row.board_id,
    folderId: row.folder_id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    url: row.url,
    name: row.name,
    size: row.size,
    type: row.type,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  };
}

// One entry per board: { folders, claims, items, columns, updates, messages,
// loading, loaded } — everything needed to compute that board's file view.
// Fetched lazily the first time a board is opened in the File Manager
// (never eagerly for the whole workspace) since items/updates can be a lot
// of data across many boards.
export function FileManagerProvider({ children }) {
  const { user } = useAuth();
  const [boardData, setBoardData] = useState({});

  const loadBoardFiles = useCallback(async (boardId) => {
    setBoardData((prev) => ({ ...prev, [boardId]: { ...(prev[boardId] || {}), loading: true } }));

    const [foldersRes, claimsRes, itemsRes, columnsRes, updatesRes, messagesRes] = await Promise.all([
      supabase.from("file_folders").select("*").eq("board_id", boardId),
      supabase.from("files").select("*").eq("board_id", boardId),
      supabase.from("items").select("id, name, fields").eq("board_id", boardId),
      supabase.from("columns").select("id, type").eq("board_id", boardId).eq("type", "files"),
      supabase.from("updates").select("id, files, author_id, created_at").eq("board_id", boardId).is("deleted_at", null),
      supabase.from("board_messages").select("id, files, sender_id, created_at").eq("board_id", boardId),
    ]);

    for (const [label, res] of Object.entries({
      folders: foldersRes,
      claims: claimsRes,
      items: itemsRes,
      columns: columnsRes,
      updates: updatesRes,
      messages: messagesRes,
    })) {
      if (res.error) console.error(`Error loading file manager ${label}:`, res.error);
    }

    setBoardData((prev) => ({
      ...prev,
      [boardId]: {
        folders: (foldersRes.data || []).map(mapFolder),
        claims: (claimsRes.data || []).map(mapClaim),
        items: itemsRes.data || [],
        fileColumnIds: (columnsRes.data || []).map((c) => c.id),
        updates: updatesRes.data || [],
        messages: messagesRes.data || [],
        loading: false,
        loaded: true,
      },
    }));
  }, []);

  // Aggregates every file the board actually has (from item file-columns,
  // update attachments, chat attachments), minus whichever of those have
  // been "claimed" into a custom folder, plus manual uploads and claimed
  // files grouped by their folder. Nothing here is persisted — it's
  // recomputed from boardData on every call.
  const getBoardFiles = useCallback(
    (boardId) => {
      const data = boardData[boardId];
      if (!data || !data.loaded) return { unfiled: { manual: [], item: [], update: [], message: [] }, byFolder: {}, folders: [] };

      const claimedKey = (sourceType, sourceId, url) => `${sourceType}:${sourceId}:${url}`;
      const claimed = new Set(
        data.claims.filter((c) => c.sourceType !== "manual").map((c) => claimedKey(c.sourceType, c.sourceId, c.url))
      );

      const unfiled = { manual: [], item: [], update: [], message: [] };
      const byFolder = {};

      const bucketFor = (folderId) => {
        if (!folderId) return null;
        if (!byFolder[folderId]) byFolder[folderId] = [];
        return byFolder[folderId];
      };

      // Manual uploads and claimed item/update/message files both live in
      // the `files` table — route each into its folder bucket (or the
      // "manual" unfiled bucket, for a manual upload never filed anywhere).
      for (const claim of data.claims) {
        const bucket = bucketFor(claim.folderId);
        if (bucket) bucket.push(claim);
        else if (claim.sourceType === "manual") unfiled.manual.push(claim);
        // A claimed item/update/message file with no folder_id shouldn't
        // normally happen (claiming always sets a folder), but if it does,
        // fall through and let the live-aggregated copy below represent it.
      }

      for (const item of data.items) {
        for (const colId of data.fileColumnIds) {
          const raw = item.fields?.[colId];
          if (!raw) continue;
          for (const f of parseFilesValue(raw)) {
            if (f.isLink) continue;
            if (claimed.has(claimedKey("item", item.id, f.url))) continue;
            unfiled.item.push({ ...f, sourceType: "item", sourceId: item.id, itemName: item.name, columnId: colId });
          }
        }
      }

      for (const update of data.updates) {
        for (const f of update.files || []) {
          if (claimed.has(claimedKey("update", update.id, f.url))) continue;
          unfiled.update.push({ ...f, sourceType: "update", sourceId: update.id, uploadedBy: update.author_id, createdAt: update.created_at });
        }
      }

      for (const message of data.messages) {
        for (const f of message.files || []) {
          if (claimed.has(claimedKey("message", message.id, f.url))) continue;
          unfiled.message.push({ ...f, sourceType: "message", sourceId: message.id, uploadedBy: message.sender_id, createdAt: message.created_at });
        }
      }

      return { unfiled, byFolder, folders: data.folders };
    },
    [boardData]
  );

  const createFolder = async (boardId, parentId, name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    const { data, error } = await supabase
      .from("file_folders")
      .insert({ board_id: boardId, parent_id: parentId || null, name: trimmed })
      .select()
      .single();
    if (error) {
      console.error("Error creating folder:", error);
      return;
    }
    setBoardData((prev) => ({
      ...prev,
      [boardId]: { ...prev[boardId], folders: [...(prev[boardId]?.folders || []), mapFolder(data)] },
    }));
  };

  const deleteFolder = async (boardId, folderId) => {
    const data = boardData[boardId];
    const hasChildFolder = data?.folders.some((f) => f.parentId === folderId);
    const hasFiles = data?.claims.some((c) => c.folderId === folderId);
    if (hasChildFolder || hasFiles) {
      alert("Folder harus dikosongkan dulu sebelum dihapus.");
      return;
    }
    const { error } = await supabase.from("file_folders").delete().eq("id", folderId);
    if (error) {
      console.error("Error deleting folder:", error);
      return;
    }
    setBoardData((prev) => ({
      ...prev,
      [boardId]: { ...prev[boardId], folders: prev[boardId].folders.filter((f) => f.id !== folderId) },
    }));
  };

  // "Claims" an existing item/update/message file into a folder, or moves
  // an already-claimed/manual file to a different folder.
  const moveFileToFolder = async (boardId, file, folderId) => {
    if (file.sourceType === "manual" || (file.id && boardData[boardId]?.claims.some((c) => c.id === file.id))) {
      const { data, error } = await supabase
        .from("files")
        .update({ folder_id: folderId || null })
        .eq("id", file.id)
        .select()
        .single();
      if (error) {
        console.error("Error moving file:", error);
        return;
      }
      setBoardData((prev) => ({
        ...prev,
        [boardId]: {
          ...prev[boardId],
          claims: prev[boardId].claims.map((c) => (c.id === data.id ? mapClaim(data) : c)),
        },
      }));
      return;
    }

    const { data, error } = await supabase
      .from("files")
      .insert({
        board_id: boardId,
        folder_id: folderId || null,
        source_type: file.sourceType,
        source_id: file.sourceId,
        url: file.url,
        name: file.name,
        size: file.size ?? null,
        type: file.type ?? null,
        uploaded_by: file.uploadedBy ?? null,
      })
      .select()
      .single();
    if (error) {
      console.error("Error claiming file into folder:", error);
      return;
    }
    setBoardData((prev) => ({
      ...prev,
      [boardId]: { ...prev[boardId], claims: [...prev[boardId].claims, mapClaim(data)] },
    }));
  };

  const uploadManualFile = async (boardId, folderId, file) => {
    const uploaded = await uploadToCloudinary(file);
    if (!uploaded) return;
    const { data, error } = await supabase
      .from("files")
      .insert({
        board_id: boardId,
        folder_id: folderId || null,
        source_type: "manual",
        url: uploaded.url,
        name: uploaded.name,
        size: uploaded.size,
        type: uploaded.type,
        uploaded_by: user?.id ?? null,
      })
      .select()
      .single();
    if (error) {
      console.error("Error saving uploaded file:", error);
      return;
    }
    setBoardData((prev) => ({
      ...prev,
      [boardId]: { ...prev[boardId], claims: [...prev[boardId].claims, mapClaim(data)] },
    }));
  };

  // Manual/claimed rows just delete their own `files` row. An
  // item/update/message file that was never claimed has no row of its own
  // yet — deleting it means splicing it out of wherever it actually lives,
  // same as FileAttachment.jsx's removeFile / UpdatePanel.jsx's attachment
  // removal, so the File Manager never shows a "deleted" file that's still
  // sitting on the original item or chat message.
  const deleteFile = async (boardId, file) => {
    const isClaimRow = file.id && boardData[boardId]?.claims.some((c) => c.id === file.id);
    if (isClaimRow) {
      const { error } = await supabase.from("files").delete().eq("id", file.id);
      if (error) {
        console.error("Error deleting file:", error);
        return;
      }
      setBoardData((prev) => ({
        ...prev,
        [boardId]: { ...prev[boardId], claims: prev[boardId].claims.filter((c) => c.id !== file.id) },
      }));
      return;
    }

    if (file.sourceType === "item") {
      const item = boardData[boardId]?.items.find((i) => i.id === file.sourceId);
      if (!item) return;
      const current = parseFilesValue(item.fields?.[file.columnId]);
      const next = current.filter((f) => f.url !== file.url);
      const { error } = await supabase
        .from("items")
        .update({ fields: { ...item.fields, [file.columnId]: JSON.stringify(next) } })
        .eq("id", item.id);
      if (error) {
        console.error("Error deleting item file:", error);
        return;
      }
      setBoardData((prev) => ({
        ...prev,
        [boardId]: {
          ...prev[boardId],
          items: prev[boardId].items.map((i) =>
            i.id === item.id ? { ...i, fields: { ...i.fields, [file.columnId]: JSON.stringify(next) } } : i
          ),
        },
      }));
    } else if (file.sourceType === "update") {
      const update = boardData[boardId]?.updates.find((u) => u.id === file.sourceId);
      if (!update) return;
      const next = (update.files || []).filter((f) => f.url !== file.url);
      const { error } = await supabase.from("updates").update({ files: next }).eq("id", update.id);
      if (error) {
        console.error("Error deleting update file:", error);
        return;
      }
      setBoardData((prev) => ({
        ...prev,
        [boardId]: { ...prev[boardId], updates: prev[boardId].updates.map((u) => (u.id === update.id ? { ...u, files: next } : u)) },
      }));
    } else if (file.sourceType === "message") {
      const message = boardData[boardId]?.messages.find((m) => m.id === file.sourceId);
      if (!message) return;
      const next = (message.files || []).filter((f) => f.url !== file.url);
      const { error } = await supabase.from("board_messages").update({ files: next }).eq("id", message.id);
      if (error) {
        console.error("Error deleting message file:", error);
        return;
      }
      setBoardData((prev) => ({
        ...prev,
        [boardId]: { ...prev[boardId], messages: prev[boardId].messages.map((m) => (m.id === message.id ? { ...m, files: next } : m)) },
      }));
    }
  };

  const value = {
    boardData,
    loadBoardFiles,
    getBoardFiles,
    createFolder,
    deleteFolder,
    moveFileToFolder,
    uploadManualFile,
    deleteFile,
  };

  return <FileManagerContext.Provider value={value}>{children}</FileManagerContext.Provider>;
}

export function useFileManager() {
  const context = useContext(FileManagerContext);
  if (!context) {
    throw new Error("useFileManager must be used within a FileManagerProvider");
  }
  return context;
}
