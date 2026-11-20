import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];
export type Especialidad = Enums["especialidad"];
export type Rol = Enums["rol_despacho"];

export const ESPECIALIDADES: Record<Especialidad, string> = {
  civil: "Civil",
  familia: "Familia",
  laboral: "Laboral",
  penal: "Penal",
  promiscuo: "Promiscuo",
  contencioso_administrativo: "Contencioso Administrativo",
};

export const ROLES: Record<Rol, string> = {
  juez: "Juez",
  secretario: "Secretario",
  sustanciador: "Sustanciador",
};

export const LISTA_ESPECIALIDADES = Object.keys(ESPECIALIDADES) as [Especialidad, ...Especialidad[]];
export const LISTA_ROLES = Object.keys(ROLES) as [Rol, ...Rol[]];
