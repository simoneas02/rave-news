import styles from "./index.module.css";

function Home() {
  return (
    <div className={` ${styles.heart_bg}`}>
      <div className={styles.container}>
        <h1 className={styles.container__title}>🔥 Heyyyy my BABE 💋</h1>

        <p className={styles.container__text}>Look at YOUUUU!!! 🤩🤩🤩</p>

        <p className={styles.container__text}>Look at YOUUUU!!! 👀👀👀</p>
        <p className={styles.container__text}>
          You are so fucking beautiful 🫠{" "}
        </p>
        <p className={styles.container__text}>
          And <strong className={styles.container__text_strong}>PLEASE</strong>{" "}
          put that beautiful smile on your face and remember: I only want to see
          you happy, filled with joy and love! 😍{" "}
        </p>
        <p className={styles.container__text}>
          I cannot wait to see you again 💟{" "}
        </p>
      </div>
    </div>
  );
}

export default Home;
