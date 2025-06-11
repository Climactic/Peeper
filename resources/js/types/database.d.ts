export interface DatabaseMetadata {
    database: string;
    version: string;
    server: {
        server_version: string;
        max_connections: string;
        shared_buffers: string;
        work_mem: string;
        timezone: string;
        database_size: string;
        active_connections: number;
    };
    database_config: {
        datname: string;
        encoding: string;
        collation: string;
    };
    last_updated: string;
}

export interface DatabaseConnection {
    id: string;
    name: string;
    host: string;
    port: number;
    type: DatabaseConnectionType;
    database: string;
    metadata?: DatabaseMetadata;
}

export enum DatabaseConnectionType {
    POSTGRES = "postgres",
}
