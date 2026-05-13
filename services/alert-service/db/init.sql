CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('pending', 'acknowledged', 'resolved')) DEFAULT 'pending',
  triggered_at TEXT DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT
);