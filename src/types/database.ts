export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      administradores_plataforma: {
        Row: {
          creado_en: string;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          creado_en?: string;
          usuario_id: string;
        };
        Update: {
          creado_en?: string;
          usuario_id?: string;
        };
        Relationships: [];
      };
      auditoria: {
        Row: {
          accion: Database["public"]["Enums"]["accion_auditoria"];
          datos_anteriores: Json | null;
          datos_nuevos: Json | null;
          despacho_id: string | null;
          id: number;
          ocurrido_en: string;
          registro_id: string | null;
          tabla: string;
          usuario_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          accion: Database["public"]["Enums"]["accion_auditoria"];
          datos_anteriores?: Json | null;
          datos_nuevos?: Json | null;
          despacho_id?: string | null;
          id?: never;
          ocurrido_en?: string;
          registro_id?: string | null;
          tabla: string;
          usuario_id?: string | null;
        };
        Update: {
          accion?: Database["public"]["Enums"]["accion_auditoria"];
          datos_anteriores?: Json | null;
          datos_nuevos?: Json | null;
          despacho_id?: string | null;
          id?: never;
          ocurrido_en?: string;
          registro_id?: string | null;
          tabla?: string;
          usuario_id?: string | null;
        };
        Relationships: [];
      };
      despachos: {
        Row: {
          actualizado_en: string;
          codigo: string;
          creado_en: string;
          creado_por: string;
          departamento: string;
          especialidad: Database["public"]["Enums"]["especialidad"];
          id: string;
          municipio: string;
          nombre: string;
          seccional: string;
          umbral_amarillo_pct: number;
          umbral_rojo_pct: number;
          vacancia_colectiva: boolean;
          verificado: boolean;
          verificado_en: string | null;
          verificado_por: string | null;
        };
        ComputedFields: never;
        Insert: {
          actualizado_en?: string;
          codigo: string;
          creado_en?: string;
          creado_por: string;
          departamento: string;
          especialidad: Database["public"]["Enums"]["especialidad"];
          id?: string;
          municipio: string;
          nombre: string;
          seccional: string;
          umbral_amarillo_pct?: number;
          umbral_rojo_pct?: number;
          vacancia_colectiva?: boolean;
          verificado?: boolean;
          verificado_en?: string | null;
          verificado_por?: string | null;
        };
        Update: {
          actualizado_en?: string;
          codigo?: string;
          creado_en?: string;
          creado_por?: string;
          departamento?: string;
          especialidad?: Database["public"]["Enums"]["especialidad"];
          id?: string;
          municipio?: string;
          nombre?: string;
          seccional?: string;
          umbral_amarillo_pct?: number;
          umbral_rojo_pct?: number;
          vacancia_colectiva?: boolean;
          verificado?: boolean;
          verificado_en?: string | null;
          verificado_por?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "despachos_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "despachos_verificado_por_fkey";
            columns: ["verificado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      documentos: {
        Row: {
          creado_en: string;
          creado_por: string;
          datos_combinados: Json | null;
          despacho_id: string;
          id: string;
          nombre_archivo: string;
          proceso_id: string;
          ruta_archivo: string;
          sha256: string | null;
          tamano_bytes: number;
          tipo: Database["public"]["Enums"]["tipo_documento_judicial"];
          tipo_mime: string;
          version_plantilla_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          creado_en?: string;
          creado_por: string;
          datos_combinados?: Json | null;
          despacho_id: string;
          id?: string;
          nombre_archivo: string;
          proceso_id: string;
          ruta_archivo: string;
          sha256?: string | null;
          tamano_bytes: number;
          tipo: Database["public"]["Enums"]["tipo_documento_judicial"];
          tipo_mime: string;
          version_plantilla_id?: string | null;
        };
        Update: {
          creado_en?: string;
          creado_por?: string;
          datos_combinados?: Json | null;
          despacho_id?: string;
          id?: string;
          nombre_archivo?: string;
          proceso_id?: string;
          ruta_archivo?: string;
          sha256?: string | null;
          tamano_bytes?: number;
          tipo?: Database["public"]["Enums"]["tipo_documento_judicial"];
          tipo_mime?: string;
          version_plantilla_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "documentos_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documentos_proceso_id_despacho_id_fkey";
            columns: ["proceso_id", "despacho_id"];
            isOneToOne: false;
            referencedRelation: "procesos";
            referencedColumns: ["id", "despacho_id"];
          },
          {
            foreignKeyName: "documentos_version_plantilla_id_fkey";
            columns: ["version_plantilla_id"];
            isOneToOne: false;
            referencedRelation: "versiones_plantilla";
            referencedColumns: ["id"];
          },
        ];
      };
      festivos: {
        Row: {
          fecha: string;
          nombre: string;
          norma: string;
        };
        ComputedFields: never;
        Insert: {
          fecha: string;
          nombre: string;
          norma?: string;
        };
        Update: {
          fecha?: string;
          nombre?: string;
          norma?: string;
        };
        Relationships: [];
      };
      indices_economicos: {
        Row: {
          acto_soporte: string | null;
          cargado_en: string;
          cargado_por: string | null;
          fuente: string;
          id: string;
          modalidad: string;
          tipo: Database["public"]["Enums"]["tipo_indice"];
          unidad: string;
          valor: number;
          vigencia: unknown;
        };
        ComputedFields: never;
        Insert: {
          acto_soporte?: string | null;
          cargado_en?: string;
          cargado_por?: string | null;
          fuente: string;
          id?: string;
          modalidad?: string;
          tipo: Database["public"]["Enums"]["tipo_indice"];
          unidad: string;
          valor: number;
          vigencia: unknown;
        };
        Update: {
          acto_soporte?: string | null;
          cargado_en?: string;
          cargado_por?: string | null;
          fuente?: string;
          id?: string;
          modalidad?: string;
          tipo?: Database["public"]["Enums"]["tipo_indice"];
          unidad?: string;
          valor?: number;
          vigencia?: unknown;
        };
        Relationships: [
          {
            foreignKeyName: "indices_economicos_cargado_por_fkey";
            columns: ["cargado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      medidas_cautelares: {
        Row: {
          actualizado_en: string;
          creado_en: string;
          creado_por: string;
          descripcion: string;
          despacho_id: string;
          documento_oficio_id: string | null;
          entidad_destinataria: string;
          estado: Database["public"]["Enums"]["estado_medida"];
          fecha_decreto: string;
          fecha_levantamiento: string | null;
          fecha_oficio: string | null;
          fecha_registro: string | null;
          id: string;
          observaciones: string | null;
          proceso_id: string;
          tipo: Database["public"]["Enums"]["tipo_medida"];
          valor_limite: number | null;
        };
        ComputedFields: never;
        Insert: {
          actualizado_en?: string;
          creado_en?: string;
          creado_por: string;
          descripcion: string;
          despacho_id: string;
          documento_oficio_id?: string | null;
          entidad_destinataria: string;
          estado?: Database["public"]["Enums"]["estado_medida"];
          fecha_decreto: string;
          fecha_levantamiento?: string | null;
          fecha_oficio?: string | null;
          fecha_registro?: string | null;
          id?: string;
          observaciones?: string | null;
          proceso_id: string;
          tipo: Database["public"]["Enums"]["tipo_medida"];
          valor_limite?: number | null;
        };
        Update: {
          actualizado_en?: string;
          creado_en?: string;
          creado_por?: string;
          descripcion?: string;
          despacho_id?: string;
          documento_oficio_id?: string | null;
          entidad_destinataria?: string;
          estado?: Database["public"]["Enums"]["estado_medida"];
          fecha_decreto?: string;
          fecha_levantamiento?: string | null;
          fecha_oficio?: string | null;
          fecha_registro?: string | null;
          id?: string;
          observaciones?: string | null;
          proceso_id?: string;
          tipo?: Database["public"]["Enums"]["tipo_medida"];
          valor_limite?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "medidas_cautelares_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medidas_cautelares_documento_oficio_id_fkey";
            columns: ["documento_oficio_id"];
            isOneToOne: false;
            referencedRelation: "documentos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medidas_cautelares_proceso_id_despacho_id_fkey";
            columns: ["proceso_id", "despacho_id"];
            isOneToOne: false;
            referencedRelation: "procesos";
            referencedColumns: ["id", "despacho_id"];
          },
        ];
      };
      membresias: {
        Row: {
          activo: boolean;
          actualizado_en: string;
          creado_en: string;
          despacho_id: string;
          id: string;
          rol: Database["public"]["Enums"]["rol_despacho"];
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          activo?: boolean;
          actualizado_en?: string;
          creado_en?: string;
          despacho_id: string;
          id?: string;
          rol: Database["public"]["Enums"]["rol_despacho"];
          usuario_id: string;
        };
        Update: {
          activo?: boolean;
          actualizado_en?: string;
          creado_en?: string;
          despacho_id?: string;
          id?: string;
          rol?: Database["public"]["Enums"]["rol_despacho"];
          usuario_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "membresias_despacho_id_fkey";
            columns: ["despacho_id"];
            isOneToOne: false;
            referencedRelation: "despachos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "membresias_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      novedades_termino: {
        Row: {
          cantidad: number | null;
          creado_en: string;
          creado_por: string;
          despacho_id: string;
          fecha_fin: string | null;
          fecha_inicio: string;
          id: string;
          soporte: string;
          termino_id: string;
          tipo: Database["public"]["Enums"]["tipo_novedad_termino"];
          unidad: Database["public"]["Enums"]["unidad_termino"] | null;
        };
        ComputedFields: never;
        Insert: {
          cantidad?: number | null;
          creado_en?: string;
          creado_por: string;
          despacho_id: string;
          fecha_fin?: string | null;
          fecha_inicio: string;
          id?: string;
          soporte: string;
          termino_id: string;
          tipo: Database["public"]["Enums"]["tipo_novedad_termino"];
          unidad?: Database["public"]["Enums"]["unidad_termino"] | null;
        };
        Update: {
          cantidad?: number | null;
          creado_en?: string;
          creado_por?: string;
          despacho_id?: string;
          fecha_fin?: string | null;
          fecha_inicio?: string;
          id?: string;
          soporte?: string;
          termino_id?: string;
          tipo?: Database["public"]["Enums"]["tipo_novedad_termino"];
          unidad?: Database["public"]["Enums"]["unidad_termino"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "novedades_termino_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "novedades_termino_termino_id_despacho_id_fkey";
            columns: ["termino_id", "despacho_id"];
            isOneToOne: false;
            referencedRelation: "terminos";
            referencedColumns: ["id", "despacho_id"];
          },
        ];
      };
      partes: {
        Row: {
          actualizado_en: string;
          correo: string | null;
          creado_en: string;
          creado_por: string;
          despacho_id: string;
          id: string;
          nombre: string;
          numero_identificacion: string | null;
          proceso_id: string;
          representa_a: string | null;
          tipo: Database["public"]["Enums"]["tipo_parte"];
          tipo_identificacion: string | null;
        };
        ComputedFields: never;
        Insert: {
          actualizado_en?: string;
          correo?: string | null;
          creado_en?: string;
          creado_por: string;
          despacho_id: string;
          id?: string;
          nombre: string;
          numero_identificacion?: string | null;
          proceso_id: string;
          representa_a?: string | null;
          tipo: Database["public"]["Enums"]["tipo_parte"];
          tipo_identificacion?: string | null;
        };
        Update: {
          actualizado_en?: string;
          correo?: string | null;
          creado_en?: string;
          creado_por?: string;
          despacho_id?: string;
          id?: string;
          nombre?: string;
          numero_identificacion?: string | null;
          proceso_id?: string;
          representa_a?: string | null;
          tipo?: Database["public"]["Enums"]["tipo_parte"];
          tipo_identificacion?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "partes_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "partes_proceso_id_despacho_id_fkey";
            columns: ["proceso_id", "despacho_id"];
            isOneToOne: false;
            referencedRelation: "procesos";
            referencedColumns: ["id", "despacho_id"];
          },
          {
            foreignKeyName: "partes_representa_a_fkey";
            columns: ["representa_a"];
            isOneToOne: false;
            referencedRelation: "partes";
            referencedColumns: ["id"];
          },
        ];
      };
      perfiles: {
        Row: {
          actualizado_en: string;
          correo: string;
          creado_en: string;
          id: string;
          nombre_completo: string;
        };
        ComputedFields: never;
        Insert: {
          actualizado_en?: string;
          correo: string;
          creado_en?: string;
          id: string;
          nombre_completo?: string;
        };
        Update: {
          actualizado_en?: string;
          correo?: string;
          creado_en?: string;
          id?: string;
          nombre_completo?: string;
        };
        Relationships: [];
      };
      plantillas: {
        Row: {
          activo: boolean;
          actualizado_en: string;
          categoria: Database["public"]["Enums"]["categoria_plantilla"];
          creado_en: string;
          creado_por: string | null;
          descripcion: string | null;
          despacho_id: string | null;
          especialidad: Database["public"]["Enums"]["especialidad"] | null;
          id: string;
          nombre: string;
        };
        ComputedFields: never;
        Insert: {
          activo?: boolean;
          actualizado_en?: string;
          categoria: Database["public"]["Enums"]["categoria_plantilla"];
          creado_en?: string;
          creado_por?: string | null;
          descripcion?: string | null;
          despacho_id?: string | null;
          especialidad?: Database["public"]["Enums"]["especialidad"] | null;
          id?: string;
          nombre: string;
        };
        Update: {
          activo?: boolean;
          actualizado_en?: string;
          categoria?: Database["public"]["Enums"]["categoria_plantilla"];
          creado_en?: string;
          creado_por?: string | null;
          descripcion?: string | null;
          despacho_id?: string | null;
          especialidad?: Database["public"]["Enums"]["especialidad"] | null;
          id?: string;
          nombre?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plantillas_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plantillas_despacho_id_fkey";
            columns: ["despacho_id"];
            isOneToOne: false;
            referencedRelation: "despachos";
            referencedColumns: ["id"];
          },
        ];
      };
      procesos: {
        Row: {
          actualizado_en: string;
          asignado_a: string | null;
          clase: string;
          creado_en: string;
          creado_por: string;
          despacho_id: string;
          especialidad: Database["public"]["Enums"]["especialidad"];
          estado: Database["public"]["Enums"]["estado_proceso"];
          fecha_reparto: string | null;
          id: string;
          instancia: string;
          observaciones: string | null;
          radicado: string;
          reservado: boolean;
        };
        ComputedFields: never;
        Insert: {
          actualizado_en?: string;
          asignado_a?: string | null;
          clase: string;
          creado_en?: string;
          creado_por: string;
          despacho_id: string;
          especialidad: Database["public"]["Enums"]["especialidad"];
          estado?: Database["public"]["Enums"]["estado_proceso"];
          fecha_reparto?: string | null;
          id?: string;
          instancia?: string;
          observaciones?: string | null;
          radicado: string;
          reservado?: boolean;
        };
        Update: {
          actualizado_en?: string;
          asignado_a?: string | null;
          clase?: string;
          creado_en?: string;
          creado_por?: string;
          despacho_id?: string;
          especialidad?: Database["public"]["Enums"]["especialidad"];
          estado?: Database["public"]["Enums"]["estado_proceso"];
          fecha_reparto?: string | null;
          id?: string;
          instancia?: string;
          observaciones?: string | null;
          radicado?: string;
          reservado?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "procesos_asignado_a_fkey";
            columns: ["asignado_a"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "procesos_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "procesos_despacho_id_fkey";
            columns: ["despacho_id"];
            isOneToOne: false;
            referencedRelation: "despachos";
            referencedColumns: ["id"];
          },
        ];
      };
      suspensiones_terminos: {
        Row: {
          alcance: Database["public"]["Enums"]["alcance_suspension"];
          creado_en: string;
          creado_por: string | null;
          despacho_id: string | null;
          fecha_fin: string;
          fecha_inicio: string;
          id: string;
          motivo: string;
          seccional: string | null;
          soporte: string;
          tipo: Database["public"]["Enums"]["tipo_suspension"];
        };
        ComputedFields: never;
        Insert: {
          alcance: Database["public"]["Enums"]["alcance_suspension"];
          creado_en?: string;
          creado_por?: string | null;
          despacho_id?: string | null;
          fecha_fin: string;
          fecha_inicio: string;
          id?: string;
          motivo: string;
          seccional?: string | null;
          soporte: string;
          tipo: Database["public"]["Enums"]["tipo_suspension"];
        };
        Update: {
          alcance?: Database["public"]["Enums"]["alcance_suspension"];
          creado_en?: string;
          creado_por?: string | null;
          despacho_id?: string | null;
          fecha_fin?: string;
          fecha_inicio?: string;
          id?: string;
          motivo?: string;
          seccional?: string | null;
          soporte?: string;
          tipo?: Database["public"]["Enums"]["tipo_suspension"];
        };
        Relationships: [
          {
            foreignKeyName: "suspensiones_terminos_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "suspensiones_terminos_despacho_id_fkey";
            columns: ["despacho_id"];
            isOneToOne: false;
            referencedRelation: "despachos";
            referencedColumns: ["id"];
          },
        ];
      };
      terminos: {
        Row: {
          actualizado_en: string;
          calculado_en: string | null;
          cantidad: number;
          creado_en: string;
          creado_por: string;
          cumplido_en: string | null;
          despacho_id: string;
          estado: Database["public"]["Enums"]["estado_termino"];
          fecha_evento: string;
          fecha_vencimiento: string | null;
          hora_evento: string | null;
          hora_vencimiento: string | null;
          id: string;
          observaciones: string | null;
          proceso_id: string;
          tipo_codigo: string;
          unidad: Database["public"]["Enums"]["unidad_termino"];
        };
        ComputedFields: never;
        Insert: {
          actualizado_en?: string;
          calculado_en?: string | null;
          cantidad: number;
          creado_en?: string;
          creado_por: string;
          cumplido_en?: string | null;
          despacho_id: string;
          estado?: Database["public"]["Enums"]["estado_termino"];
          fecha_evento: string;
          fecha_vencimiento?: string | null;
          hora_evento?: string | null;
          hora_vencimiento?: string | null;
          id?: string;
          observaciones?: string | null;
          proceso_id: string;
          tipo_codigo: string;
          unidad: Database["public"]["Enums"]["unidad_termino"];
        };
        Update: {
          actualizado_en?: string;
          calculado_en?: string | null;
          cantidad?: number;
          creado_en?: string;
          creado_por?: string;
          cumplido_en?: string | null;
          despacho_id?: string;
          estado?: Database["public"]["Enums"]["estado_termino"];
          fecha_evento?: string;
          fecha_vencimiento?: string | null;
          hora_evento?: string | null;
          hora_vencimiento?: string | null;
          id?: string;
          observaciones?: string | null;
          proceso_id?: string;
          tipo_codigo?: string;
          unidad?: Database["public"]["Enums"]["unidad_termino"];
        };
        Relationships: [
          {
            foreignKeyName: "terminos_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "terminos_proceso_id_despacho_id_fkey";
            columns: ["proceso_id", "despacho_id"];
            isOneToOne: false;
            referencedRelation: "procesos";
            referencedColumns: ["id", "despacho_id"];
          },
          {
            foreignKeyName: "terminos_tipo_codigo_fkey";
            columns: ["tipo_codigo"];
            isOneToOne: false;
            referencedRelation: "tipos_termino";
            referencedColumns: ["codigo"];
          },
        ];
      };
      tipos_termino: {
        Row: {
          activo: boolean;
          cantidad: number;
          codigo: string;
          descripcion: string | null;
          especialidades: Database["public"]["Enums"]["especialidad"][] | null;
          estado_validacion: Database["public"]["Enums"]["estado_validacion"];
          nombre: string;
          norma: string;
          unidad: Database["public"]["Enums"]["unidad_termino"];
        };
        ComputedFields: never;
        Insert: {
          activo?: boolean;
          cantidad: number;
          codigo: string;
          descripcion?: string | null;
          especialidades?: Database["public"]["Enums"]["especialidad"][] | null;
          estado_validacion?: Database["public"]["Enums"]["estado_validacion"];
          nombre: string;
          norma: string;
          unidad: Database["public"]["Enums"]["unidad_termino"];
        };
        Update: {
          activo?: boolean;
          cantidad?: number;
          codigo?: string;
          descripcion?: string | null;
          especialidades?: Database["public"]["Enums"]["especialidad"][] | null;
          estado_validacion?: Database["public"]["Enums"]["estado_validacion"];
          nombre?: string;
          norma?: string;
          unidad?: Database["public"]["Enums"]["unidad_termino"];
        };
        Relationships: [];
      };
      versiones_plantilla: {
        Row: {
          creado_en: string;
          creado_por: string | null;
          id: string;
          notas: string | null;
          plantilla_id: string;
          ruta_archivo: string;
          variables: NonNullable<Json>;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          creado_en?: string;
          creado_por?: string | null;
          id?: string;
          notas?: string | null;
          plantilla_id: string;
          ruta_archivo: string;
          variables?: NonNullable<Json>;
          version: number;
        };
        Update: {
          creado_en?: string;
          creado_por?: string | null;
          id?: string;
          notas?: string | null;
          plantilla_id?: string;
          ruta_archivo?: string;
          variables?: NonNullable<Json>;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "versiones_plantilla_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "versiones_plantilla_plantilla_id_fkey";
            columns: ["plantilla_id"];
            isOneToOne: false;
            referencedRelation: "plantillas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      comparte_despacho: { Args: { p_usuario: string }; Returns: boolean };
      crear_despacho: {
        Args: {
          p_codigo: string;
          p_departamento: string;
          p_especialidad: Database["public"]["Enums"]["especialidad"];
          p_municipio: string;
          p_nombre: string;
          p_seccional: string;
        };
        Returns: string;
      };
      es_admin_plataforma: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      puede_usar_ruta_plantilla: {
        Args: { p_escribir: boolean; p_ruta: string };
        Returns: boolean;
      };
      puede_ver_proceso: { Args: { p_proceso: string }; Returns: boolean };
      puede_ver_ruta_expediente: { Args: { p_ruta: string }; Returns: boolean };
      registrar_acceso_documento: {
        Args: {
          p_accion: Database["public"]["Enums"]["accion_auditoria"];
          p_documento: string;
        };
        Returns: undefined;
      };
      tiene_rol: {
        Args: {
          p_despacho: string;
          p_roles?: Database["public"]["Enums"]["rol_despacho"][];
        };
        Returns: boolean;
      };
      verificar_despacho: { Args: { p_despacho: string }; Returns: undefined };
    };
    Enums: {
      accion_auditoria:
        | "crear"
        | "modificar"
        | "eliminar"
        | "consultar"
        | "descargar";
      alcance_suspension: "nacional" | "seccional" | "despacho";
      categoria_plantilla: "auto" | "sentencia" | "oficio" | "otro";
      especialidad:
        | "civil"
        | "familia"
        | "laboral"
        | "penal"
        | "promiscuo"
        | "contencioso_administrativo";
      estado_medida:
        | "decretada"
        | "oficiada"
        | "registrada"
        | "levantada"
        | "sin_efecto";
      estado_proceso: "activo" | "terminado" | "archivado";
      estado_termino: "en_curso" | "suspendido" | "cumplido" | "cancelado";
      estado_validacion: "pendiente_validacion" | "validado";
      rol_despacho: "juez" | "secretario" | "sustanciador";
      tipo_documento_judicial:
        | "providencia"
        | "oficio"
        | "anexo"
        | "expediente";
      tipo_indice: "interes_bancario_corriente" | "ipc";
      tipo_medida:
        | "embargo_cuenta_bancaria"
        | "embargo_vehiculo"
        | "embargo_inmueble"
        | "embargo_salario"
        | "secuestro"
        | "inscripcion_demanda"
        | "medida_aseguramiento"
        | "suspension_provisional"
        | "otra";
      tipo_novedad_termino: "suspension" | "interrupcion" | "prorroga";
      tipo_parte:
        | "demandante"
        | "demandado"
        | "accionante"
        | "accionado"
        | "vinculado"
        | "apoderado"
        | "ministerio_publico"
        | "tercero";
      tipo_suspension:
        | "vacancia_colectiva"
        | "semana_santa"
        | "acuerdo_csj"
        | "cierre_despacho"
        | "otro";
      unidad_termino:
        | "horas"
        | "dias_habiles"
        | "dias_calendario"
        | "meses"
        | "anios";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      accion_auditoria: [
        "crear",
        "modificar",
        "eliminar",
        "consultar",
        "descargar",
      ],
      alcance_suspension: ["nacional", "seccional", "despacho"],
      categoria_plantilla: ["auto", "sentencia", "oficio", "otro"],
      especialidad: [
        "civil",
        "familia",
        "laboral",
        "penal",
        "promiscuo",
        "contencioso_administrativo",
      ],
      estado_medida: [
        "decretada",
        "oficiada",
        "registrada",
        "levantada",
        "sin_efecto",
      ],
      estado_proceso: ["activo", "terminado", "archivado"],
      estado_termino: ["en_curso", "suspendido", "cumplido", "cancelado"],
      estado_validacion: ["pendiente_validacion", "validado"],
      rol_despacho: ["juez", "secretario", "sustanciador"],
      tipo_documento_judicial: ["providencia", "oficio", "anexo", "expediente"],
      tipo_indice: ["interes_bancario_corriente", "ipc"],
      tipo_medida: [
        "embargo_cuenta_bancaria",
        "embargo_vehiculo",
        "embargo_inmueble",
        "embargo_salario",
        "secuestro",
        "inscripcion_demanda",
        "medida_aseguramiento",
        "suspension_provisional",
        "otra",
      ],
      tipo_novedad_termino: ["suspension", "interrupcion", "prorroga"],
      tipo_parte: [
        "demandante",
        "demandado",
        "accionante",
        "accionado",
        "vinculado",
        "apoderado",
        "ministerio_publico",
        "tercero",
      ],
      tipo_suspension: [
        "vacancia_colectiva",
        "semana_santa",
        "acuerdo_csj",
        "cierre_despacho",
        "otro",
      ],
      unidad_termino: [
        "horas",
        "dias_habiles",
        "dias_calendario",
        "meses",
        "anios",
      ],
    },
  },
} as const;
