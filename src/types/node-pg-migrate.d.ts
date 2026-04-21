declare module "node-pg-migrate" {
  export interface ColumnDefinitions {
    [key: string]: unknown;
  }

  export interface MigrationBuilder {
    createExtension(name: string, options?: { ifNotExists?: boolean }): void;
    createTable(name: string, columns: ColumnDefinitions): void;
    addColumns(name: string, columns: ColumnDefinitions): void;
    addConstraint(name: string, constraintName: string, options: Record<string, unknown>): void;
    addIndex(name: string, columns: string[], options?: Record<string, unknown>): void;
    dropIndex(name: string, columns: string[], options?: Record<string, unknown>): void;
    dropConstraint(name: string, constraintName: string, options?: Record<string, unknown>): void;
    dropColumns(name: string, columns: string[], options?: Record<string, unknown>): void;
    dropTable(name: string, options?: { ifExists?: boolean }): void;
    sql(sql: string): void;
    func(name: string): unknown;
  }
}
