import PlannerList from "@/components/PlannerList";
import styles from "./planner.module.css";

export default function PlannerPage() {
  return (
    <main className={styles.wrap}>
      <h1 className="h2">Planner</h1>
      <PlannerList />
    </main>
  );
}
