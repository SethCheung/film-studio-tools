-- 项目表
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    producer TEXT,
    description TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 节点表
CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT 'blue',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    dept TEXT,
    leader TEXT,
    members TEXT DEFAULT '[]',
    note TEXT,
    location TEXT,
    feishu_event_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 更新触发器
CREATE TRIGGER IF NOT EXISTS update_project_timestamp
AFTER UPDATE ON projects
BEGIN
    UPDATE projects SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_node_timestamp
AFTER UPDATE ON nodes
BEGIN
    UPDATE nodes SET updated_at = datetime('now') WHERE id = NEW.id;
END;