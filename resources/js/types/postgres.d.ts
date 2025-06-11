export interface Schema {
    schema_name: string;
}

export interface Table {
    table_schema: string;
    table_name: string;
}

export interface Column {
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
    is_primary_key?: boolean;
}

export interface TableRecord {
    [key: string]: string | number | boolean | null;
}

export interface Pagination {
    page: number;
    perPage: number;
    total: number;
}

export interface Filter {
    column: string;
    operator:
        | "eq"
        | "neq"
        | "gt"
        | "gte"
        | "lt"
        | "lte"
        | "like"
        | "ilike"
        | "is"
        | "is_not"
        | "between"
        | "not_between"
        | "in"
        | "not_in"
        | "is_null"
        | "is_not_null";
    value: string;
}

export interface SortOption {
    id?: string;
    column: string;
    direction: "asc" | "desc";
}

export interface ConnectionStatus {
    id: string;
    connection_status: boolean;
    connection_error: string | null;
    last_tested: string;
}
