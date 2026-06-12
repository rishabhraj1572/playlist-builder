"use client";

import { useEffect, useMemo, useState } from "react";
import type { Channel, StreamType } from "../lib/types";
import { clearChannels, loadChannels, saveChannels } from "../lib/storage";
import { encodePlaylistData, generateM3U } from "../lib/playlist";

const emptyForm = (): Omit<Channel, "id" | "createdAt" | "updatedAt"> => ({
  name: "",
  logo: "",
  url: "",
  type: "hls",
  groupTitle: "",
  tvgId: "",
  description: "",
  notes: "",
  origin: "",
  referer: "",
  cookie: "",
  userAgent: ""
});

function now() {
  return Date.now();
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeLine(line: string) {
  return line.trim().replace(/\s+/g, " ");
}

export default function Page() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [exportText, setExportText] = useState("");
  const [bulkText, setBulkText] = useState("");

  useEffect(() => {
    setChannels(loadChannels());
  }, []);

  useEffect(() => {
    saveChannels(channels);
    setExportText(generateM3U(channels));
  }, [channels]);

  const editing = useMemo(
    () => channels.find((c) => c.id === editingId) ?? null,
    [channels, editingId]
  );

  useEffect(() => {
    if (!editing) return;
    setForm({
      name: editing.name,
      logo: editing.logo,
      url: editing.url,
      type: editing.type,
      groupTitle: editing.groupTitle,
      tvgId: editing.tvgId,
      description: editing.description,
      notes: editing.notes,
      origin: editing.origin,
      referer: editing.referer,
      cookie: editing.cookie,
      userAgent: editing.userAgent
    });
  }, [editing]);

  const stats = useMemo(() => {
    const hls = channels.filter((c) => c.type === "hls").length;
    const dash = channels.filter((c) => c.type === "dash").length;
    return { total: channels.length, hls, dash };
  }, [channels]);

  const visibleChannels = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter((c) =>
      [
        c.name,
        c.groupTitle,
        c.tvgId,
        c.url,
        c.description,
        c.notes,
        c.type
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [channels, filter]);

  const playlistData = useMemo(() => encodePlaylistData(channels), [channels]);

  const playlistUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/api/playlist?data=${playlistData}`;
  }, [playlistData]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
  }

  function onSave() {
    const clean: Channel = {
      id: editingId ?? makeId(),
      createdAt: editing?.createdAt ?? now(),
      updatedAt: now(),
      ...form
    };

    if (!clean.name.trim() || !clean.url.trim()) {
      alert("Channel name and stream URL are required.");
      return;
    }

    setChannels((prev) => {
      if (editingId) {
        return prev.map((c) => (c.id === editingId ? clean : c));
      }
      return [clean, ...prev];
    });
    resetForm();
  }

  function onDelete(id: string) {
    setChannels((prev) => prev.filter((c) => c.id !== id));
    if (editingId === id) resetForm();
  }

  function onDuplicate(id: string) {
    setChannels((prev) => {
      const src = prev.find((c) => c.id === id);
      if (!src) return prev;
      const copy: Channel = {
        ...src,
        id: makeId(),
        name: src.name.endsWith(" Copy") ? `${src.name} 2` : `${src.name} Copy`,
        createdAt: now(),
        updatedAt: now()
      };
      return [copy, ...prev];
    });
  }

  function onMove(id: string, direction: -1 | 1) {
    setChannels((prev) => {
      const index = prev.findIndex((c) => c.id === id);
      if (index < 0) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;

      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  function onExportJson() {
    const blob = new Blob([JSON.stringify(channels, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "channels.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyText(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    alert(`${label} copied.`);
  }

  function onDownloadM3U() {
    const blob = new Blob([exportText], { type: "application/x-mpegURL" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "playlist.m3u";
    a.click();
    URL.revokeObjectURL(url);
  }

  function onDownloadJson() {
    const blob = new Blob([JSON.stringify(channels, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "playlist-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImportJson(file: File) {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? "[]"));

        if (!Array.isArray(parsed)) {
          throw new Error("Invalid JSON");
        }

        const normalized = parsed
          .filter(Boolean)
          .map((c: any): Channel => ({
            id: c.id ?? makeId(),
            name: c.name ?? "",
            logo: c.logo ?? "",
            url: c.url ?? "",
            type: (c.type === "dash" ? "dash" : "hls") as StreamType,
            groupTitle: c.groupTitle ?? "",
            tvgId: c.tvgId ?? "",
            description: c.description ?? "",
            notes: c.notes ?? "",
            origin: c.origin ?? "",
            referer: c.referer ?? "",
            cookie: c.cookie ?? "",
            userAgent: c.userAgent ?? "",
            createdAt: typeof c.createdAt === "number" ? c.createdAt : now(),
            updatedAt: typeof c.updatedAt === "number" ? c.updatedAt : now()
          }))
          .filter((c: Channel) => c.name.trim().length > 0 && c.url.trim().length > 0);

        setChannels(normalized);
        alert("Imported successfully.");
      } catch (err) {
        console.error(err);
        alert("Could not import JSON.");
      }
    };

    reader.readAsText(file);
  }

  function onAddFromBulkText() {
    const raw = bulkText.trim();
    if (!raw) {
      alert("Paste some items first.");
      return;
    }

    try {
      let items: Array<Record<string, unknown>> = [];

      if (raw.startsWith("[")) {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) throw new Error("Invalid JSON array");
        items = parsed as Array<Record<string, unknown>>;
      } else {
        const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        items = lines.map((line) => {
          if (line.includes("|")) {
            const [name, url, logo, groupTitle] = line.split("|").map((part) => part.trim());
            return { name, url, logo, groupTitle };
          }
          if (line.includes(",")) {
            const [name, url] = line.split(",").map((part) => part.trim());
            return { name, url };
          }
          return { name: `Channel ${Math.random().toString(16).slice(2, 6)}`, url: line };
        });
      }

      const normalized = items
        .map((item): Channel | null => {
          const name = String(item.name ?? item.title ?? item.channel ?? "").trim();
          const url = String(item.url ?? item.link ?? item.stream ?? "").trim();
          if (!url) return null;
          return {
            id: makeId(),
            name: name || `Channel ${channels.length + 1}`,
            logo: String(item.logo ?? item.image ?? "").trim(),
            url,
            type: String(item.type ?? "hls") === "dash" ? "dash" : "hls",
            groupTitle: String(item.groupTitle ?? item.group ?? "").trim(),
            tvgId: String(item.tvgId ?? item.id ?? "").trim(),
            description: String(item.description ?? item.desc ?? "").trim(),
            notes: String(item.notes ?? "").trim(),
            origin: String(item.origin ?? "").trim(),
            referer: String(item.referer ?? "").trim(),
            cookie: String(item.cookie ?? "").trim(),
            userAgent: String(item.userAgent ?? "").trim(),
            createdAt: now(),
            updatedAt: now()
          };
        })
        .filter((item): item is Channel => item !== null);

      if (!normalized.length) {
        alert("No valid lines found.");
        return;
      }

      setChannels((prev) => [...normalized, ...prev]);
      setBulkText("");
      alert(`Added ${normalized.length} item(s).`);
    } catch (err) {
      console.error(err);
      alert("Bulk add failed. Paste JSON array or lines in name|url format.");
    }
  }

  function seedExample() {
    setChannels([
      {
        id: makeId(),
        name: "Sample News",
        logo: "https://dummyimage.com/128x128/111827/93c5fd.png&text=NEWS",
        url: "https://example.com/live.m3u8",
        type: "hls",
        groupTitle: "News",
        tvgId: "sample.news",
        description: "Example HLS channel",
        notes: "Demo note",
        origin: "",
        referer: "",
        cookie: "",
        userAgent: "",
        createdAt: now(),
        updatedAt: now()
      },
      {
        id: makeId(),
        name: "Sample Sports",
        logo: "https://dummyimage.com/128x128/111827/34d399.png&text=SPORTS",
        url: "https://example.com/stream.mpd",
        type: "dash",
        groupTitle: "Sports",
        tvgId: "sample.sports",
        description: "Example DASH channel",
        notes: "",
        origin: "",
        referer: "",
        cookie: "",
        userAgent: "",
        createdAt: now(),
        updatedAt: now()
      }
    ]);
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-top">
          <div>
            <span className="badge">Vercel-ready • Local JSON storage • M3U export</span>
            <h1>Playlist Builder</h1>
            <p>
              Add channels, keep them in your browser as a simple JSON-backed store,
              and export a raw M3U playlist or a shareable playlist URL.
            </p>
          </div>
          <div className="hero-actions">
            <button className="btn-ghost" onClick={seedExample}>Load sample</button>
            <button className="btn-ghost" onClick={onExportJson}>Export JSON</button>
            <button className="btn-ghost" onClick={onDownloadJson}>Download backup</button>
            <button className="btn-danger" onClick={() => { clearChannels(); setChannels([]); resetForm(); }}>Clear all</button>
          </div>
        </div>

        <div className="toolbar">
          <div className="card">
            <h3>Total channels</h3>
            <div style={{ fontSize: 34, fontWeight: 800 }}>{stats.total}</div>
            <small>{stats.hls} HLS • {stats.dash} DASH</small>
          </div>

          <div className="card">
            <h3>Playlist URL</h3>
            <small className="muted">Copies a live /api/playlist link with your current data encoded in it.</small>
            <div className="footer-row">
              <button className="btn" onClick={() => copyText(playlistUrl, "Playlist URL")}>Copy URL</button>
              <button className="btn-ghost" onClick={() => window.open(playlistUrl, "_blank", "noopener,noreferrer")}>Open</button>
            </div>
          </div>

          <div className="card">
            <h3>Playlist content</h3>
            <small className="muted">Download or copy the generated M3U text.</small>
            <div className="footer-row">
              <button className="btn-ghost" onClick={() => copyText(exportText, "Playlist text")}>Copy M3U</button>
              <button className="btn-ghost" onClick={onDownloadM3U}>Download M3U</button>
            </div>
          </div>
        </div>
      </section>

      <div className="layout" style={{ marginTop: 18 }}>
        <aside className="editor">
          <h2>{editingId ? "Edit channel" : "Add channel"}</h2>

          <div className="field">
            <label>Channel name</label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Channel name" />
          </div>

          <div className="grid">
            <div className="field">
              <label>Logo URL</label>
              <input value={form.logo} onChange={(e) => setForm((p) => ({ ...p, logo: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="field">
              <label>Stream URL</label>
              <input value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://...m3u8 / .mpd" />
            </div>
          </div>

          <div className="grid">
            <div className="field">
              <label>Stream type</label>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as StreamType }))}>
                <option value="hls">HLS / M3U8</option>
                <option value="dash">DASH / MPD</option>
              </select>
            </div>
            <div className="field">
              <label>Group title</label>
              <input value={form.groupTitle} onChange={(e) => setForm((p) => ({ ...p, groupTitle: e.target.value }))} placeholder="Sports, News, etc." />
            </div>
          </div>

          <div className="grid">
            <div className="field">
              <label>TVG ID</label>
              <input value={form.tvgId} onChange={(e) => setForm((p) => ({ ...p, tvgId: e.target.value }))} placeholder="channel.id" />
            </div>
            <div className="field">
              <label>User-Agent</label>
              <input value={form.userAgent} onChange={(e) => setForm((p) => ({ ...p, userAgent: e.target.value }))} placeholder="Mozilla/5.0 ..." />
            </div>
          </div>

          <div className="grid">
            <div className="field">
              <label>Origin</label>
              <input value={form.origin} onChange={(e) => setForm((p) => ({ ...p, origin: e.target.value }))} placeholder="https://example.com" />
            </div>
            <div className="field">
              <label>Referer</label>
              <input value={form.referer} onChange={(e) => setForm((p) => ({ ...p, referer: e.target.value }))} placeholder="https://example.com/page" />
            </div>
          </div>

          <div className="field">
            <label>Cookie</label>
            <textarea value={form.cookie} onChange={(e) => setForm((p) => ({ ...p, cookie: e.target.value }))} placeholder="session=..." />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Optional notes" />
          </div>

          <div className="field">
            <label>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Extra internal notes shown in the playlist as comments" />
          </div>

          <div className="sticky-actions">
            <button className="btn" onClick={onSave}>{editingId ? "Update channel" : "Add channel"}</button>
            <button className="btn-ghost" onClick={resetForm}>Reset form</button>
          </div>

          <div className="note">
            Use this only with streams you are allowed to access. This app stores channel data in local browser JSON and supports bulk add, reorder, duplicate, notes, and backup.
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="field">
              <label>Import channels JSON</label>
              <input
                type="file"
                accept="application/json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImportJson(file);
                  e.currentTarget.value = "";
                }}
              />
            </div>

            <div className="field">
              <label>Bulk add (JSON array or lines like Name | URL)</label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`Sample News | https://example.com/live.m3u8
Sample Sports | https://example.com/stream.mpd`}
              />
            </div>

            <div className="sticky-actions" style={{ marginTop: 0 }}>
              <button className="btn-ghost" onClick={onAddFromBulkText}>Add from pasted list</button>
              <button className="btn-ghost" onClick={() => setBulkText("")}>Clear paste box</button>
            </div>
          </div>
        </aside>

        <section className="list-wrap">
          <div className="panel" style={{ padding: 16 }}>
            <div className="list-top">
              <div>
                <h2 style={{ margin: 0 }}>Channels</h2>
                <div className="muted" style={{ marginTop: 6 }}>
                  Search, edit, delete, reorder, duplicate, and export any time.
                </div>
              </div>

              <div className="list-tools">
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter channels..."
                  style={{
                    background: "rgba(255,255,255,.05)",
                    color: "var(--text)",
                    border: "1px solid rgba(255,255,255,.08)",
                    borderRadius: 14,
                    padding: "12px 13px",
                    outline: "none",
                    minWidth: 240
                  }}
                />
              </div>
            </div>

            <div className="list">
              {visibleChannels.length === 0 ? (
                <div className="card">
                  <h3>No channels yet</h3>
                  <small>Add one from the editor or load the sample channels.</small>
                </div>
              ) : (
                visibleChannels.map((c) => {
                  const actualIndex = channels.findIndex((item) => item.id === c.id);
                  return (
                  <article className="list-item" key={c.id}>
                    <div className="item-head">
                      <div className="item-meta">
                        <img
                          className="logo"
                          src={c.logo || "https://dummyimage.com/128x128/111827/ffffff.png&text=TV"}
                          alt=""
                        />
                        <div className="title">
                          <h4>{c.name}</h4>
                          <p>{c.url}</p>
                        </div>
                      </div>

                      <div className="item-actions">
                        <button className="mini" onClick={() => { setEditingId(c.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
                        <button className="mini" onClick={() => onDuplicate(c.id)}>Duplicate</button>
                        <button className="mini" onClick={() => onMove(c.id, -1)} disabled={actualIndex <= 0} style={{ opacity: actualIndex <= 0 ? 0.45 : 1 }}>Up</button>
                        <button className="mini" onClick={() => onMove(c.id, 1)} disabled={actualIndex < 0 || actualIndex === channels.length - 1} style={{ opacity: actualIndex < 0 || actualIndex === channels.length - 1 ? 0.45 : 1 }}>Down</button>
                        <button className="mini danger" onClick={() => onDelete(c.id)}>Delete</button>
                      </div>
                    </div>

                    <div className="pill-row">
                      {c.groupTitle ? <span className="pill">Group: {c.groupTitle}</span> : null}
                      <span className="pill">{c.type.toUpperCase()}</span>
                      {c.tvgId ? <span className="pill">TVG: {c.tvgId}</span> : null}
                      {c.notes ? <span className="pill">Notes set</span> : null}
                      {c.origin ? <span className="pill">Origin set</span> : null}
                      {c.referer ? <span className="pill">Referer set</span> : null}
                      {c.cookie ? <span className="pill">Cookie set</span> : null}
                    </div>

                    {c.description ? (
                      <div className="muted" style={{ marginTop: 10, lineHeight: 1.5 }}>
                        {c.description}
                      </div>
                    ) : null}

                    {c.notes ? (
                      <div className="muted" style={{ marginTop: 8, lineHeight: 1.5, opacity: 0.9 }}>
                        <strong>Notes:</strong> {c.notes}
                      </div>
                    ) : null}
                  </article>
                );
                })
              )}
            </div>
          </div>

          <div className="panel" style={{ padding: 16 }}>
            <h2>M3U playlist preview</h2>
            <div className="muted">This is the exact playlist text generated from the channels above.</div>
            <div className="playlist-box">
              <textarea readOnly value={exportText} />
            </div>

            <div className="footer-row">
              <button className="btn" onClick={() => copyText(playlistUrl, "Playlist URL")}>Copy playlist URL</button>
              <button className="btn-ghost" onClick={() => copyText(exportText, "Playlist text")}>Copy M3U</button>
              <button className="btn-ghost" onClick={onDownloadM3U}>Download M3U</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
