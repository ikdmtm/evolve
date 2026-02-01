export type WorkoutType = "strength" | "cardio" | "light";

export type Workout = {
  id: string;
  date: string; // YYYY-MM-DD (local)
  type: WorkoutType;
  title?: string;
  note?: string;
  createdAt: number;
  strength?: {
    exercises: Exercise[];
  };
  cardio?: {
    minutes: number;
    intensity?: "easy" | "medium" | "hard";
  };
  light?: {
    minutes?: number;
    label?: string;
  };
};

export type Exercise = {
  name: string;
  sets: SetEntry[];
};

export type SetEntry = {
  reps?: number;
  weightKg?: number;
  rpe?: number;
  note?: string;
};

export type DayState = {
  date: string; // YYYY-MM-DD
  isRestDay: boolean;
  didActivity: boolean; // derived: workouts exist? (stored or computed)
};
