export type SimulatorDiscipline = "Physics" | "Chemistry" | "Math";

export type SimulatorDefinition = {
  id: string;
  name: string;
  discipline: SimulatorDiscipline;
  domain: string;
  status: "live" | "planned";
  summary: string;
};
