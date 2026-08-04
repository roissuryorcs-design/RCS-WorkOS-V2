import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import { DMProvider } from "./context/DMContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ColumnProvider, useColumns } from "./context/ColumnContext";
import { GroupProvider, useGroups } from "./context/GroupContext";
import { ItemsProvider, useItems } from "./context/ItemsContext";
import { BoardsProvider, useBoards } from "./context/BoardsContext";
import { MobileNavProvider } from "./context/MobileNavContext";
import LoginScreen from "./components/LoginScreen";
import LandingPage from "./components/LandingPage";
import { getDefaultGroupName } from "./i18n/defaults";
import { boardKey } from "./utils/boardStorage";
import { exportBoardToExcel } from "./utils/exportExcel";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import ViewTabs from "./components/ViewTabs";
import BoardTable from "./components/BoardTable";
import Dashboard from "./components/Dashboard";
import StatusManager from "./components/StatusManager";
import ProgressStageManager from "./components/ProgressStageManager";
import ColumnManager from "./components/ColumnManager";
import AddColumnPopup from "./components/AddColumnPopup";
import FormulaEditor from "./components/FormulaEditor";
import "./App.css";
import { UpdateProvider } from './context/UpdateContext';
import UpdatePanel from './components/UpdatePanel';

function BoardWorkspace({ boardId }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [activeStatusColumnId, setActiveStatusColumnId] = useState(null);
  const [showProgressStageManager, setShowProgressStageManager] = useState(false);
  const [activeProgressColumnId, setActiveProgressColumnId] = useState(null);
  const [showAddColumnPopup, setShowAddColumnPopup] = useState(false);
  const [showFormulaEditor, setShowFormulaEditor] = useState(false);
  const [activeFormulaColumnId, setActiveFormulaColumnId] = useState(null);
  const [currentView, setCurrentView] = useState('table');

  const { columns, visibleColumns, addColumn, renameColumn, toggleColumn, deleteColumn, resetColumns, updateColumnStatuses, updateColumnStatusOrder, updateColumnFormula, updateColumnProgressStages } = useColumns();
  const { nodes: allBoardNodes } = useBoards();
  const boardTitle = allBoardNodes.find((n) => n.id === boardId)?.name;

  // Groups (name/color/header-color/order) live in Supabase via
  // GroupContext; items (below) live in Supabase via ItemsContext, keyed
  // to a group by `group_id` — renaming a group no longer needs to touch
  // any item row at all (see ItemsContext.jsx), only deleting/creating a
  // group still needs an item-side effect (cascade cleanup / seeding).
  const {
    groups,
    groupColors,
    groupHeaderColors,
    createGroup,
    renameGroupEntry,
    removeGroup,
    reorderGroups: persistGroupOrder,
    updateGroupColor,
    updateGroupHeaderColor,
    groupIdByName,
    loading: groupsLoading,
  } = useGroups();

  const {
    items,
    loading: itemsLoading,
    addItem,
    addSubItem,
    updateItem,
    deleteItem,
    removeItemsByGroupId,
  } = useItems();

  const isInitialized = !groupsLoading && !itemsLoading;

  // Table/Dashboard mode is per-device UI navigation state, not shared
  // board content — syncing it via Supabase Realtime meant switching tabs
  // on one device yanked every other session (including the *same*
  // person's other device) into that same tab too, which reads as a bug
  // to anyone used to how tab/view selection works in any other
  // collaborative app. Kept local via localStorage instead, same
  // per-board-key convention this project used pre-migration.
  useEffect(() => {
    if (!boardId) return;
    const saved = localStorage.getItem(boardKey('forelCurrentView', boardId));
    if (saved) setCurrentView(saved);
  }, [boardId]);

  const changeView = (view) => {
    setCurrentView(view);
    if (boardId) localStorage.setItem(boardKey('forelCurrentView', boardId), view);
  };

  // ============================================================
  // GROUP CRUD — the group *row* (name/color/order) is owned by
  // GroupContext; item CRUD is owned by ItemsContext. This component just
  // composes the two where a group operation has an item-side effect.
  // ============================================================
  const renameGroup = (oldName, newName) => {
    if (!newName || !newName.trim()) return;
    const trimmed = newName.trim();
    if (groups.some((g) => g === trimmed && g !== oldName)) {
      alert(t("app.groupAlreadyExists", { name: trimmed }));
      return;
    }
    renameGroupEntry(oldName, trimmed);
  };

  const deleteGroup = (groupName) => {
    if (groups.length <= 1) {
      alert(t("app.cannotDeleteLastGroup"));
      return;
    }
    if (!confirm(t("app.deleteGroupConfirm", { name: groupName }))) return;
    const groupId = groupIdByName[groupName];
    if (groupId) removeItemsByGroupId(groupId);
    removeGroup(groupName);
  };

  // Takes the name directly rather than prompting — the only caller
  // (BoardTable's handleAddGroup) already prompts and validates before
  // calling this, so prompting again here used to show a second, unexpected
  // dialog that silently killed group creation if the user dismissed it.
  // Doesn't seed items itself — ItemsContext's reactive auto-add effect
  // notices the new empty group and seeds it (the one seeding code path,
  // shared with "group emptied later" — see ItemsContext.jsx).
  const addGroup = (name) => {
    if (!name || !name.trim()) return;
    if (groups.some((g) => g === name.trim())) {
      alert(t("app.groupAlreadyExists", { name: name.trim() }));
      return;
    }
    createGroup(name.trim());
  };

  const reorderGroups = (newOrder) => {
    if (!Array.isArray(newOrder) || newOrder.length === 0) return;
    persistGroupOrder(newOrder);
  };

  const openStatusManager = (columnId) => {
    setActiveStatusColumnId(columnId);
    setShowStatusManager(true);
  };

  const openProgressManager = (columnId) => {
    setActiveProgressColumnId(columnId);
    setShowProgressStageManager(true);
  };

  const openFormulaEditor = (columnId) => {
    setActiveFormulaColumnId(columnId);
    setShowFormulaEditor(true);
  };

  const handleAddColumn = (name, type) => {
    addColumn(name, type);
  };

  // ============================================================
  // EXPORT
  // ============================================================
  const exportData = () => {
    exportBoardToExcel({ boardTitle, items, columns: visibleColumns, groups, groupColors });
  };

  // ============================================================
  // FILTER & SEARCH
  // ============================================================
  const filterItemsRecursive = (items, searchTerm) => {
    const lowerSearch = searchTerm.toLowerCase();
    return items
      .map((item) => {
        const matches =
          item.item.toLowerCase().includes(lowerSearch) ||
          (item.document && item.document.toLowerCase().includes(lowerSearch)) ||
          (item.people && item.people.toLowerCase().includes(lowerSearch));

        let filteredChildren = [];
        if (item.children && item.children.length > 0) {
          filteredChildren = filterItemsRecursive(item.children, searchTerm);
        }

        if (matches || filteredChildren.length > 0) {
          return {
            ...item,
            children: filteredChildren,
            isExpanded: filteredChildren.length > 0 ? true : item.isExpanded,
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  // ============================================================
  // STATS
  // ============================================================
  const countAllItems = (items) => {
    let count = 0;
    items.forEach((item) => {
      count++;
      if (item.children && item.children.length > 0) {
        count += countAllItems(item.children);
      }
    });
    return count;
  };

  // "Done" secara historis cocok string status apa pun; sekarang default
  // status set sudah tidak ada "Done" lagi (jadi "Closed"/"Ditutup") —
  // bandingkan ke label default saat ini, bukan string Inggris hardcode,
  // supaya tetap kena untuk board yang masih pakai default status.
  const countDoneItems = (items) => {
    const closedLabel = t("defaults.statusClosed");
    let count = 0;
    items.forEach((item) => {
      if (item.status && item.status === closedLabel) count++;
      if (item.children && item.children.length > 0) {
        count += countDoneItems(item.children);
      }
    });
    return count;
  };

  const filteredItems = search.trim() === ""
    ? items
    : filterItemsRecursive(items, search);

  const totalItems = countAllItems(filteredItems);
  const doneItems = countDoneItems(filteredItems);
  const pendingItems = totalItems - doneItems;

  // ============================================================
  // 🔥 GROUPS DARI STATE, BUKAN DARI ITEMS
  // ============================================================
  const allGroups = groups;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <div className="main-content">
        <Header groups={allGroups || []} boardId={boardId} isReady={isInitialized} />

        <ViewTabs currentView={currentView} onChange={changeView} />

        {currentView === "dashboard" ? (
          <div style={{ padding: "0 24px", flex: 1, minHeight: 0, overflowY: "auto" }}>
            <Dashboard boardId={boardId} items={items} columns={columns} groups={allGroups} groupColors={groupColors} />
          </div>
        ) : (
          <>
            <Toolbar
              search={search}
              onSearchChange={setSearch}
              onAddGroup={addGroup}
              onExport={exportData}
              onOpenColumnManager={() => setShowColumnManager(true)}
            />

            <BoardTable
              items={filteredItems}
              groups={allGroups}
              defaultGroupName={getDefaultGroupName(t)}
              groupColors={groupColors}
              onUpdateGroupColor={updateGroupColor}
              groupHeaderColors={groupHeaderColors}
              onUpdateGroupHeaderColor={updateGroupHeaderColor}
              onUpdateItem={updateItem}
              onDeleteItem={deleteItem}
              onAddGroup={addGroup}
              onDeleteGroup={deleteGroup}
              onAddItem={addItem}
              onAddSubItem={addSubItem}
              onOpenStatusManager={openStatusManager}
              onOpenProgressManager={openProgressManager}
              onOpenFormula={openFormulaEditor}
              onRenameGroup={renameGroup}
              onReorderGroups={reorderGroups}
              onOpenAddColumn={() => setShowAddColumnPopup(true)}
            />

            <div className="board-footer">
              <div className="footer-stats">
                <span>{t("app.footerTotal")} <strong>{totalItems}</strong> {t("app.footerItems")}</span>
                <span className="footer-divider">|</span>
                <span>{t("app.footerDone")} <strong style={{ color: "#22c55e" }}>{doneItems}</strong></span>
                <span className="footer-divider">|</span>
                <span>{t("app.footerPending")} <strong style={{ color: "#f59e0b" }}>{pendingItems}</strong></span>
              </div>
              <div className="footer-actions">
                <span className="footer-status">
                  <span className="status-dot"></span>
                  {t("app.footerAutoSaved")}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {showStatusManager && (
        <StatusManager
          columnId={activeStatusColumnId}
          statuses={columns.find((c) => c.id === activeStatusColumnId)?.statuses || {}}
          statusOrder={columns.find((c) => c.id === activeStatusColumnId)?.statusOrder || []}
          onUpdateStatuses={(newStatuses) => {
            updateColumnStatuses(activeStatusColumnId, newStatuses);
          }}
          onUpdateStatusOrder={(newOrder) => {
            updateColumnStatusOrder(activeStatusColumnId, newOrder);
          }}
          onClose={() => setShowStatusManager(false)}
        />
      )}

      {showProgressStageManager && (
        <ProgressStageManager
          columnId={activeProgressColumnId}
          stages={columns.find((c) => c.id === activeProgressColumnId)?.progressStages || []}
          onUpdateStages={(newStages) => {
            updateColumnProgressStages(activeProgressColumnId, newStages);
          }}
          onClose={() => setShowProgressStageManager(false)}
        />
      )}

      {showColumnManager && (
        <ColumnManager
          columns={columns}
          onAddColumn={addColumn}
          onDeleteColumn={deleteColumn}
          onToggleColumn={toggleColumn}
          onRenameColumn={renameColumn}
          onResetColumns={resetColumns}
          onClose={() => setShowColumnManager(false)}
        />
      )}

      {showAddColumnPopup && (
        <AddColumnPopup
          onAdd={handleAddColumn}
          onClose={() => setShowAddColumnPopup(false)}
        />
      )}

      {showFormulaEditor && (
        <FormulaEditor
          column={columns.find((c) => c.id === activeFormulaColumnId)}
          columns={columns}
          sampleItem={filteredItems[0]}
          onSave={(formula) => updateColumnFormula(activeFormulaColumnId, formula)}
          onClose={() => setShowFormulaEditor(false)}
        />
      )}
    </>
  );
}

function EmptyWorkspaceState() {
  const { createBoard } = useBoards();
  const { t } = useLanguage();

  const handleCreateBoard = () => {
    const name = prompt(t("app.newBoardNamePrompt"));
    if (name && name.trim()) createBoard(name.trim(), null);
  };

  return (
    <div className="main-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
        <p style={{ fontSize: "16px", marginBottom: "16px" }}>{t("app.noBoardsYet")}</p>
        <button className="tree-add-btn" onClick={handleCreateBoard}>{t("app.createBoard")}</button>
      </div>
    </div>
  );
}

function AppShellInner() {
  const { activeBoardId, loading } = useBoards();

  return (
    <div className="app-container">
      <Sidebar />

      {loading ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
            fontSize: 14,
          }}
        >
          …
        </div>
      ) : activeBoardId ? (
        <ColumnProvider key={activeBoardId} boardId={activeBoardId}>
          <GroupProvider boardId={activeBoardId}>
            <ItemsProvider boardId={activeBoardId}>
              <UpdateProvider boardId={activeBoardId}>
                <BoardWorkspace boardId={activeBoardId} />
                <UpdatePanel />
              </UpdateProvider>
            </ItemsProvider>
          </GroupProvider>
        </ColumnProvider>
      ) : (
        <EmptyWorkspaceState />
      )}
    </div>
  );
}

// Blocks the whole app behind a session check so every provider below
// (Boards/Column/Group/Items/Update) can assume `useAuth().user` is always
// available — all board data lives in Supabase now, gated by RLS on that user.
function AuthGate({ children }) {
  const { session, loading } = useAuth();
  const [authView, setAuthView] = useState(null); // null = landing, else "signIn" | "signUp"

  if (loading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
          color: "var(--text-secondary)",
          fontSize: 14,
        }}
      >
        …
      </div>
    );
  }

  if (!session) {
    if (!authView) return <LandingPage onGetStarted={setAuthView} />;
    return <LoginScreen initialMode={authView} onBack={() => setAuthView(null)} />;
  }

  return children;
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <AuthGate>
            <ProfileProvider>
              <DMProvider>
                <NotificationProvider>
                  <BoardsProvider>
                    <MobileNavProvider>
                      <AppShellInner />
                    </MobileNavProvider>
                  </BoardsProvider>
                </NotificationProvider>
              </DMProvider>
            </ProfileProvider>
          </AuthGate>
        </AuthProvider>
      </ThemeProvider>
      <Analytics />
    </LanguageProvider>
  );
}
