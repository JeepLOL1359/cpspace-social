import { useEffect, useMemo, useState } from "react";
import {
  addFeeling,
  CATEGORIES,
  EMPTY_FEELINGS,
  fetchFeelingsData,
  getCurrentUid,
  hideDefaultFeeling,
  MAX_CUSTOM_PER_CATEGORY,
  MAX_FEELING_LENGTH,
  restoreAllFeelings,
  restoreDefaultFeeling,
  TAB_LABELS,
  deleteFeeling,
  editFeeling,
} from "./manageFeelingsHelpers";

export default function ManageFeelings() {
  const [activeTab, setActiveTab] = useState("pos");
  const [defaultFeelings, setDefaultFeelings] = useState(EMPTY_FEELINGS);
  const [addedFeelings, setAddedFeelings] = useState(EMPTY_FEELINGS);
  const [removedFeelings, setRemovedFeelings] = useState(EMPTY_FEELINGS);
  const [newFeeling, setNewFeeling] = useState("");
  const [editingFeeling, setEditingFeeling] = useState("");
  const [editingValue, setEditingValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const uid = getCurrentUid();

  async function loadData() {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchFeelingsData(uid);
      setDefaultFeelings(data.defaultFeelings);
      setAddedFeelings(data.addedFeelings);
      setRemovedFeelings(data.removedFeelings);
    } catch (err) {
      setError(err.message || "Failed to load feelings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const effectiveFeelings = useMemo(() => {
    const computed = { pos: [], neu: [], neg: [] };

    CATEGORIES.forEach((category) => {
      computed[category] = (defaultFeelings[category] ?? [])
        .filter((feeling) => !(removedFeelings[category] ?? []).includes(feeling))
        .concat(addedFeelings[category] ?? []);
    });

    return computed;
  }, [defaultFeelings, removedFeelings, addedFeelings]);

  const customCount = (addedFeelings[activeTab] ?? []).length;

  async function handleAdd() {
    if (!uid) return;
    setError("");
    setSaving(true);

    try {
      await addFeeling({
        uid,
        category: activeTab,
        value: newFeeling,
        defaultFeelings,
        addedFeelings,
      });

      setNewFeeling("");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to add feeling.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(oldValue) {
    if (!uid) return;
    setError("");
    setSaving(true);

    try {
      await editFeeling({
        uid,
        category: activeTab,
        oldValue,
        newValue: editingValue,
        defaultFeelings,
        addedFeelings,
      });
      setEditingFeeling("");
      setEditingValue("");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to edit feeling.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCustom(value) {
    if (!uid) return;
    setError("");
    setSaving(true);

    try {
      await deleteFeeling({ uid, category: activeTab, value });
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to delete feeling.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleDefault(value, isHidden) {
    if (!uid) return;
    setError("");
    setSaving(true);

    try {
      if (isHidden) {
        await restoreDefaultFeeling({ uid, category: activeTab, value });
      } else {
        await hideDefaultFeeling({ uid, category: activeTab, value });
      }

      await loadData();
    } catch (err) {
      setError(err.message || "Failed to update default feeling visibility.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRestoreAll() {
    if (!uid) return;

    const confirmed = window.confirm(
      "Restore all feelings to default? This will remove all custom feelings, restore hidden defaults, and cannot be undone."
    );

    if (!confirmed) return;

    setError("");
    setSaving(true);

    try {
      await restoreAllFeelings(uid);
      setNewFeeling("");
      setEditingFeeling("");
      setEditingValue("");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to restore feelings.");
    } finally {
      setSaving(false);
    }
  }

  if (!uid) {
    return <div>Please sign in to manage feelings.</div>;
  }

  if (loading) {
    return <div>Loading feelings...</div>;
  }

  const currentDefaults = defaultFeelings[activeTab] ?? [];
  const currentRemoved = removedFeelings[activeTab] ?? [];
  const currentCustom = addedFeelings[activeTab] ?? [];

  return (
    <div style={{ padding: 16 }}>
      <h2>Manage Feelings</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => {
              setActiveTab(category);
              setNewFeeling("");
              setEditingFeeling("");
              setEditingValue("");
              setError("");
            }}
            disabled={saving}
            style={{
              fontWeight: activeTab === category ? 700 : 400,
            }}
          >
            {TAB_LABELS[category]}
          </button>
        ))}
      </div>

      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

      <section style={{ marginBottom: 20 }}>
        <h3>Default Feelings</h3>
        {currentDefaults.map((feeling) => {
          const hidden = currentRemoved.includes(feeling);

          return (
            <div
              key={feeling}
              style={{
                display: "flex",
                justifyContent: "space-between",
                opacity: hidden ? 0.5 : 1,
                marginBottom: 8,
              }}
            >
              <span>{feeling}</span>
              <button
                type="button"
                onClick={() => handleToggleDefault(feeling, hidden)}
                disabled={saving}
              >
                {hidden ? "Restore" : "Hide"}
              </button>
            </div>
          );
        })}
      </section>

      <section style={{ marginBottom: 20 }}>
        <h3>Custom Feelings ({customCount}/{MAX_CUSTOM_PER_CATEGORY})</h3>

        {currentCustom.map((feeling) => {
          const isEditing = editingFeeling === feeling;

          return (
            <div
              key={feeling}
              style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}
            >
              {isEditing ? (
                <>
                  <input
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    maxLength={MAX_FEELING_LENGTH}
                    disabled={saving}
                  />
                  <span>{editingValue.trim().length}/{MAX_FEELING_LENGTH}</span>
                  <button type="button" onClick={() => handleEdit(feeling)} disabled={saving}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFeeling("");
                      setEditingValue("");
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span>{feeling}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFeeling(feeling);
                      setEditingValue(feeling);
                    }}
                    disabled={saving}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustom(feeling)}
                    disabled={saving}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          );
        })}
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3>Add Feeling</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={newFeeling}
            onChange={(e) => setNewFeeling(e.target.value)}
            placeholder="Enter custom feeling"
            maxLength={MAX_FEELING_LENGTH}
            disabled={saving || customCount >= MAX_CUSTOM_PER_CATEGORY}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || customCount >= MAX_CUSTOM_PER_CATEGORY}
          >
            Add
          </button>
        </div>
        <p>{newFeeling.trim().length}/{MAX_FEELING_LENGTH}</p>
        {customCount >= MAX_CUSTOM_PER_CATEGORY ? (
          <p style={{ marginTop: 4 }}>Custom feeling limit reached for this category.</p>
        ) : null}
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3>Effective Feelings Preview</h3>
        <p>{effectiveFeelings[activeTab].join(", ") || "No feelings available."}</p>
      </section>

      <button type="button" onClick={handleRestoreAll} disabled={saving}>
        Restore All Feelings to Default
      </button>
    </div>
  );
}
