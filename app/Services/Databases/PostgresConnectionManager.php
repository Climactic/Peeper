<?php

namespace App\Services\Databases;

use App\Models\DatabaseConnection;
use Illuminate\Support\Facades\DB;

class PostgresConnectionManager
{
    /**
     * Get the connection name for a database connection.
     *
     * @param int $connectionId
     * @return string
     */
    public function getConnectionName($connectionId): string
    {
        return 'postgres_' . $connectionId;
    }

    /**
     * Configure a dynamic connection based on the DatabaseConnection model.
     *
     * @param DatabaseConnection $connection
     * @param string|null $database
     * @return string The configured connection name
     */
    public function configureConnection(DatabaseConnection $connection, $database = null): string
    {
        $connectionName = $this->getConnectionName($connection->ulid);

        // Set up a dynamic connection configuration
        config([
            'database.connections.' . $connectionName => [
                'driver' => 'pgsql',
                'host' => $connection->host,
                'port' => $connection->port,
                'database' => $database ?? $connection->database,
                'username' => $connection->username,
                'password' => $connection->password,
                'charset' => 'utf8',
                'prefix' => '',
                'schema' => 'public',
                'sslmode' => $connection->sslmode ?? 'prefer',
                'sslcert' => $connection->sslcert,
                'sslkey' => $connection->sslkey,
                'sslrootcert' => $connection->sslrootcert,
            ]
        ]);

        // Purge the connection to ensure we're using the new configuration
        DB::purge($connectionName);

        return $connectionName;
    }

    /**
     * Get a database connection.
     *
     * @param DatabaseConnection $connection
     * @param string|null $database
     * @return \Illuminate\Database\Connection
     */
    public function getConnection(DatabaseConnection $connection, $database = null)
    {
        $connectionName = $this->configureConnection($connection, $database);
        return DB::connection($connectionName);
    }

    /**
     * Clean up a database connection to prevent connection leaks.
     *
     * @param string $connectionUlid
     * @return void
     */
    public function cleanupConnection($connectionUlid): void
    {
        $connectionName = $this->getConnectionName($connectionUlid);
        DB::purge($connectionName);
    }

    /**
     * Test a PostgreSQL connection.
     *
     * @param array $credentials
     * @return bool
     * @throws \Illuminate\Database\QueryException
     */
    public function testConnection(array $credentials): bool
    {
        // Create a unique connection name to avoid collisions
        $connectionName = 'postgres_test_' . uniqid();

        config([
            'database.connections.' . $connectionName => [
                'driver' => 'pgsql',
                'host' => $credentials['host'],
                'port' => $credentials['port'],
                'username' => $credentials['username'],
                'password' => $credentials['password'],
                'database' => $credentials['database'],
                'charset' => 'utf8',
                'prefix' => '',
                'schema' => 'public',
                'sslmode' => $credentials['sslmode'] ?? 'prefer',
            ]
        ]);

        try {
            DB::connection($connectionName)->getPdo();
            return true;
        } finally {
            // Always clean up the test connection
            DB::purge($connectionName);
        }
    }

    /**
     * Update connection metadata
     *
     * @param DatabaseConnection $connection
     * @param string|null $database
     * @return array
     */
    public function updateMetadata(DatabaseConnection $connection, $database = null): array
    {
        $metadata = $this->getDatabaseMetadata($connection, $database);
        $connection->metadata = $metadata;
        $connection->save();

        return $metadata;
    }

    /**
     * Get metadata for a database connection.
     *
     * @param DatabaseConnection $connection
     * @param string|null $database
     * @return array
     */
    public function getDatabaseMetadata(DatabaseConnection $connection, $database = null): array
    {
        $db = $this->getConnection($connection, $database);

        // Get PostgreSQL version
        $versionInfo = $db->select("SELECT version()");

        // Get server information
        $serverInfo = $db->select("
            SELECT
                current_setting('server_version') as server_version,
                current_setting('max_connections') as max_connections,
                current_setting('shared_buffers') as shared_buffers,
                current_setting('work_mem') as work_mem,
                current_setting('timezone') as timezone,
                pg_size_pretty(pg_database_size(current_database())) as database_size,
                (SELECT count(*) FROM pg_stat_activity) as active_connections
        ");

        // Get database encoding and collation
        $dbConfig = $db->select("
            SELECT
                datname,
                pg_encoding_to_char(encoding) as encoding,
                datcollate as collation
            FROM pg_database
            WHERE datname = current_database()
        ");

        $metadata = $connection->metadata ?? [];
        $metadata['database'] = $database ?? $connection->database;
        $metadata['version'] = $versionInfo[0]->version ?? null;
        $metadata['server'] = $serverInfo[0] ?? null;
        $metadata['database_config'] = $dbConfig[0] ?? null;
        $metadata['last_updated'] = now()->toDateTimeString();

        return $metadata;
    }
}
