import useSWR from "swr";
import styles from "./index.module.css";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

function UpdatedAt({ isLoading, data }) {
  isLoading = true;
  if (!isLoading || !data) {
    return (
      <div className={styles.updatedAt}>
        <span className={`${styles.skeleton} ${styles.skeletonMedium}`} />
      </div>
    );
  }

  const formattedDate = new Date(data.updated_at).toLocaleString("pt-BR");

  return (
    <p className={styles.updatedAt}>
      Last updated:{" "}
      <span className={styles.updatedAtTime}>{formattedDate}</span>
    </p>
  );
}

function DatabaseStatus({ isLoading, data }) {
  const isReady = !isLoading && data;

  const { version, max_connections, opened_connections, database_name } =
    isReady ? (data.dependencies?.database ?? {}) : {};

  const connectionRatio =
    opened_connections && max_connections
      ? Math.min((opened_connections / max_connections) * 100, 100)
      : 0;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon}>🐘</span>
        <span className={styles.cardTitle}>Database</span>
        {isReady && <span className={styles.cardStatusBadge}>Operational</span>}
      </div>

      {!isReady ? (
        <div className={styles.skeletonList}>
          <div className={`${styles.skeleton} ${styles.skeletonLong}`} />
          <div className={`${styles.skeleton} ${styles.skeletonMedium}`} />
          <div className={`${styles.skeleton} ${styles.skeletonShort}`} />
          <div className={`${styles.skeleton} ${styles.skeletonMedium}`} />
        </div>
      ) : (
        <>
          <ul className={styles.metricList}>
            {database_name && (
              <li className={styles.metric}>
                <span className={styles.metricLabel}>Database</span>
                <span className={styles.metricValueAccent}>
                  {database_name}
                </span>
              </li>
            )}
            {version && (
              <li className={styles.metric}>
                <span className={styles.metricLabel}>Version</span>
                <span className={styles.metricValue}>{version}</span>
              </li>
            )}
            <li className={styles.metric}>
              <span className={styles.metricLabel}>Open connections</span>
              <span className={styles.metricValueAccent}>
                {opened_connections}
              </span>
            </li>
            <li className={styles.metric}>
              <span className={styles.metricLabel}>Max connections</span>
              <span className={styles.metricValue}>{max_connections}</span>
            </li>
          </ul>

          <div className={styles.connectionBar}>
            <div className={styles.connectionBarLabels}>
              <span>Connection usage</span>
              <span>{connectionRatio.toFixed(1)}%</span>
            </div>
            <div className={styles.connectionBarTrack}>
              <div
                className={styles.connectionBarFill}
                style={{ width: `${connectionRatio}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function StatusPage() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>Status</h1>
            <span className={styles.liveBadge}>
              <span className={styles.liveDot} />
              Live
            </span>
          </div>
          <UpdatedAt isLoading={isLoading} data={data} />
        </header>

        <DatabaseStatus isLoading={isLoading} data={data} />
      </div>
    </main>
  );
}
