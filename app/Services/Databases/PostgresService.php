<?php

namespace App\Services\Databases;

use App\Models\DatabaseConnection;
use App\Models\DatabaseQuery;
use App\Traits\DatabaseQueryHelper;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class PostgresService
{
    use DatabaseQueryHelper;

    /**
     * @var PostgresConnectionManager
     */
    protected $connectionManager;

    /**
     * @var PostgresQueryBuilder
     */
    protected $queryBuilder;

    /**
     * Create a new PostgreSQL service instance.
     */
    public function __construct(
        PostgresConnectionManager $connectionManager,
        PostgresQueryBuilder $queryBuilder
    ) {
        $this->connectionManager = $connectionManager;
        $this->queryBuilder = $queryBuilder;
    }

    /**
     * Get the default queries from config.
     *
     * @return array
     */
    public static function getDefaultQueries()
    {
        return Config::get('queries.postgres', []);
    }

    /**
     * Get a specific default query by type.
     *
     * @param  string  $type
     * @return array|null
     */
    public static function getDefaultQuery($type)
    {
        return Config::get('queries.postgres')[$type];
    }

    public function getDatabaseMetadata(DatabaseConnection $connection, $database = null)
    {
        $connectionName = 'postgres_'.$connection->ulid;
        $db = DB::connection($connectionName);

        // Get PostgreSQL version
        $versionInfo = $db->select('SELECT version()');

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
        $dbConfig = $db->select('
            SELECT
                datname,
                pg_encoding_to_char(encoding) as encoding,
                datcollate as collation
            FROM pg_database
            WHERE datname = current_database()
        ');

        $metadata = $connection->metadata ?? [];
        $metadata['database'] = $database ?? $connection->database;
        $metadata['version'] = $versionInfo[0]->version ?? null;
        $metadata['server'] = $serverInfo[0] ?? null;
        $metadata['database_config'] = $dbConfig[0] ?? null;
        $metadata['last_updated'] = now()->toDateTimeString();

        return $metadata;
    }

    /**
     * Get all databases for a connection.
     */
    public function getDatabases(DatabaseConnection $connection): array
    {
        $db = $this->connectionManager->getConnection($connection);

        try {
            $databases = $db->select('SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname');

            return $databases;
        } finally {
            $this->connectionManager->cleanupConnection($connection->ulid);
        }
    }

    /**
     * Get all schemas for a connection.
     */
    public function getSchemas(DatabaseConnection $connection, ?string $database = null): array
    {
        $db = $this->connectionManager->getConnection($connection, $database);

        try {
            return $db->select('SELECT schema_name FROM information_schema.schemata ORDER BY schema_name');
        } finally {
            $this->connectionManager->cleanupConnection($connection->ulid);
        }
    }

    /**
     * Get all tables for a connection.
     */
    public function getTables(DatabaseConnection $connection, ?string $database = null): array
    {
        $db = $this->connectionManager->getConnection($connection, $database);

        try {
            return $db->select("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema') ORDER BY table_schema, table_name");
        } finally {
            $this->connectionManager->cleanupConnection($connection->ulid);
        }
    }

    /**
     * Get columns for a specific table.
     */
    public function getTableColumns(DatabaseConnection $connection, string $table, ?string $database = null, string $schema = 'public'): array
    {
        $db = $this->connectionManager->getConnection($connection, $database);

        try {
            return $db->select("
                SELECT
                    c.column_name,
                    c.data_type,
                    c.is_nullable,
                    c.column_default,
                    (
                        SELECT
                            CASE WHEN count(1) > 0 THEN true ELSE false END
                        FROM
                            pg_constraint con
                            JOIN pg_class rel ON rel.oid = con.conrelid
                            JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
                            JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
                        WHERE
                            con.contype = 'p'
                            AND rel.relname = ?
                            AND nsp.nspname = ?
                            AND att.attname = c.column_name
                    ) AS is_primary_key
                FROM
                    information_schema.columns c
                WHERE
                    c.table_name = ?
                    AND c.table_schema = ?
                ORDER BY
                    c.ordinal_position
            ", [$table, $schema, $table, $schema]);
        } finally {
            $this->connectionManager->cleanupConnection($connection->ulid);
        }
    }

    /**
     * Get data from a specific table with pagination using stored query.
     */
    public function getTableData(
        DatabaseConnection $connection,
        string $database,
        string $table,
        int $page = 1,
        int $perPage = 20,
        string $schema = 'public',
        array $filters = [],
        array $sorting = []
    ): array {
        $offset = ($page - 1) * $perPage;
        $db = $this->connectionManager->getConnection($connection, $database);

        try {
            // Get the base query
            $queryData = $this->queryBuilder->getDefaultQuery('table_data');
            $query = $queryData['query'];

            // Add filters if provided
            $whereClause = '';
            $filterBindings = [];

            if (! empty($filters)) {
                $filterData = $this->queryBuilder->buildWhereClauseFromFilters($filters);
                if (! empty($filterData['sql'])) {
                    $whereClause = ' WHERE '.$filterData['sql'];
                    $filterBindings = $filterData['bindings'];
                }
            }

            // Replace placeholders
            $query = str_replace(':schema', $schema, $query);
            $query = str_replace(':table', $table, $query);
            $query = str_replace(':limit', $perPage, $query);
            $query = str_replace(':offset', $offset, $query);

            // Add WHERE clause if filters exist
            if (! empty($whereClause)) {
                // Check if the query already has a WHERE clause
                if (stripos($query, 'WHERE') === false) {
                    // Insert the WHERE clause before LIMIT
                    $limitPos = stripos($query, 'LIMIT');
                    if ($limitPos !== false) {
                        $query = substr_replace($query, $whereClause.' ', $limitPos, 0);
                    } else {
                        $query .= $whereClause;
                    }
                } else {
                    // Insert additional conditions with AND
                    $limitPos = stripos($query, 'LIMIT');
                    $wherePos = stripos($query, 'WHERE');

                    if ($limitPos !== false && $wherePos !== false) {
                        $conditions = substr($query, $wherePos + 6, $limitPos - ($wherePos + 6));
                        $newWhere = ' WHERE '.$conditions.' AND '.$filterData['sql'];
                        $query = substr_replace($query, $newWhere, $wherePos, $limitPos - $wherePos);
                    }
                }
            }

            // Add ORDER BY clause if sorting is provided
            if (! empty($sorting)) {
                $orderByData = $this->queryBuilder->buildOrderByClause($sorting);

                if (! empty($orderByData['sql'])) {
                    $orderByClause = ' ORDER BY '.$orderByData['sql'];

                    // Check if the query already has an ORDER BY clause
                    if (stripos($query, 'ORDER BY') === false) {
                        // Find position to insert ORDER BY (before LIMIT)
                        $limitPos = stripos($query, 'LIMIT');
                        if ($limitPos !== false) {
                            $query = substr_replace($query, $orderByClause.' ', $limitPos, 0);
                        } else {
                            $query .= $orderByClause;
                        }
                    } else {
                        // Replace existing ORDER BY with our new one
                        $orderByPos = stripos($query, 'ORDER BY');
                        $limitPos = stripos($query, 'LIMIT');

                        if ($limitPos !== false && $orderByPos !== false) {
                            $query = substr_replace(
                                $query,
                                $orderByClause,
                                $orderByPos,
                                $limitPos - $orderByPos
                            );
                        } elseif ($orderByPos !== false) {
                            // No LIMIT clause, ORDER BY is at the end
                            $query = substr_replace($query, $orderByClause, $orderByPos);
                        }
                    }
                }
            }

            // Execute the modified query with filter bindings
            $data = $db->select($query, $filterBindings);

            // Get count using the count query
            $countQueryData = $this->queryBuilder->getDefaultQuery('table_count');
            $countQuery = $countQueryData['query'];
            $countQuery = str_replace(':schema', $schema, $countQuery);
            $countQuery = str_replace(':table', $table, $countQuery);

            // Add filters to count query
            if (! empty($whereClause)) {
                if (stripos($countQuery, 'WHERE') === false) {
                    $countQuery .= $whereClause;
                } else {
                    $wherePos = stripos($countQuery, 'WHERE');
                    $endPos = strlen($countQuery);
                    $conditions = substr($countQuery, $wherePos + 6);
                    $newWhere = ' WHERE '.$conditions.' AND '.$filterData['sql'];
                    $countQuery = substr_replace($countQuery, $newWhere, $wherePos, $endPos - $wherePos);
                }
            }

            $count = $db->select($countQuery, $filterBindings);

            // Log the data query with filters to the database
            if (! empty($filters) || ! empty($sorting)) {
                // Create a descriptive message for the filters and sorting
                $description = "Query on {$schema}.{$table}";

                if (! empty($filters)) {
                    $description .= ' with filters';
                }

                if (! empty($sorting)) {
                    $description .= (! empty($filters) ? ' and' : ' with').' sorting';
                }

                // Save the executed query to the database
                DatabaseQuery::create([
                    'database_connection_id' => $connection->id,
                    'query' => $this->interpolateQuery($query, $filterBindings),
                    'executor' => 'system',
                    'executor_id' => Auth::check() ? Auth::id() : null,
                ]);
            }

            return [
                'data' => $data,
                'total' => $count[0]->count,
            ];
        } finally {
            $this->connectionManager->cleanupConnection($connection->ulid);
        }
    }

    /**
     * Execute a custom query.
     *
     * @throws QueryException
     */
    public function executeQuery(DatabaseConnection $connection, string $database, string $query): array
    {
        $db = $this->connectionManager->getConnection($connection, $database);

        try {
            // Check if the query contains multiple statements
            $statements = $this->splitSqlStatements($query);

            if (count($statements) === 1) {
                // If there's only one statement, use the standard method
                $result = $db->select($statements[0]);

                return $result;
            } else {
                // Execute multiple statements and return results from the last SELECT statement
                return $this->executeMultipleStatements($db, $statements);
            }
        } finally {
            $this->connectionManager->cleanupConnection($connection->ulid);
        }
    }

    /**
     * Execute multiple SQL statements and return results.
     *
     * @param  \Illuminate\Database\Connection  $connection
     */
    private function executeMultipleStatements($connection, array $statements): array
    {
        $finalResults = [];

        // Start a transaction for all statements
        $connection->beginTransaction();

        try {
            foreach ($statements as $statement) {
                // Check if the statement is a SELECT query
                $isSelect = preg_match('/^\s*SELECT\s/i', $statement);

                if ($isSelect) {
                    // For SELECT statements, use select() and store results
                    $results = $connection->select($statement);
                    $finalResults = $results; // Override with the latest results
                } else {
                    // For other statements (INSERT, UPDATE, etc.), use statement()
                    $connection->statement($statement);
                }
            }

            // Commit the transaction
            $connection->commit();

            return $finalResults;
        } catch (\Exception $e) {
            // Rollback on error
            $connection->rollBack();
            throw $e;
        }
    }

    /**
     * Insert a new row into a table.
     *
     * @throws QueryException
     */
    public function insertRow(
        DatabaseConnection $connection,
        string $database,
        string $schema,
        string $table,
        array $data,
        ?int $executorId = null
    ): bool {
        $columns = implode(', ', array_keys($data));
        $placeholders = [];
        $values = [];

        foreach ($data as $key => $value) {
            $placeholders[] = '?';
            $values[] = $value === '' ? null : $value;
        }

        $placeholdersStr = implode(', ', $placeholders);
        $db = $this->connectionManager->getConnection($connection, $database);

        try {
            $queryData = $this->queryBuilder->getDefaultQuery('insert_row');

            $query = $queryData['query'];
            $query = str_replace(':schema', $schema, $query);
            $query = str_replace(':table', $table, $query);
            $query = str_replace(':columns', $columns, $query);
            $query = str_replace(':values', $placeholdersStr, $query);

            $db->insert($query, $values);

            DatabaseQuery::create([
                'database_connection_id' => $connection->id,
                'query' => $this->interpolateQuery($query, $values),
                'executor' => 'user',
                'executor_id' => $executorId ?? (Auth::check() ? Auth::id() : null),
            ]);

            return true;
        } finally {
            $this->connectionManager->cleanupConnection($connection->ulid);
        }
    }

    /**
     * Execute a stored query with parameters.
     *
     * @throws QueryException
     */
    public function executeStoredQuery(DatabaseConnection $connection, string $database, string $type, array $parameters): array
    {
        $db = $this->connectionManager->getConnection($connection, $database);

        try {
            $queryData = $this->queryBuilder->getDefaultQuery($type);
            $query = $queryData['query'];

            // Replace placeholders with actual values
            foreach ($parameters as $key => $value) {
                $query = str_replace(":{$key}", $value, $query);
            }

            $result = $db->select($query);

            DatabaseQuery::create([
                'database_connection_id' => $connection->id,
                'query' => $query,
                'executor' => 'system',
                'executor_id' => Auth::check() ? Auth::id() : null,
            ]);

            return $result;
        } finally {
            $this->connectionManager->cleanupConnection($connection->ulid);
        }
    }

    /**
     * Get the total count of rows in a table.
     */
    public function getTableCount(
        DatabaseConnection $connection,
        string $database,
        string $table,
        string $schema = 'public',
        array $filters = []
    ): int {
        $db = $this->connectionManager->getConnection($connection, $database);

        try {
            $qualifiedTable = "{$schema}.{$table}";

            // Build count query with filters
            $query = "SELECT COUNT(*) as count FROM {$qualifiedTable}";
            $bindings = [];

            if (! empty($filters)) {
                $whereClause = $this->queryBuilder->buildWhereClauseFromFilters($filters);
                if (! empty($whereClause['sql'])) {
                    $query .= ' WHERE '.$whereClause['sql'];
                    $bindings = $whereClause['bindings'];
                }
            }

            $result = $db->select($query, $bindings);

            return (int) $result[0]->count;
        } finally {
            $this->connectionManager->cleanupConnection($connection->ulid);
        }
    }

    /**
     * Split a SQL string into individual statements.
     */
    private function splitSqlStatements(string $sql): array
    {
        // Trim whitespace
        $sql = trim($sql);

        // If empty, return empty array
        if (empty($sql)) {
            return [];
        }

        // Split by semicolons, but not those inside quotes
        $statements = [];
        $currentStatement = '';
        $inSingleQuote = false;
        $inDoubleQuote = false;
        $length = strlen($sql);

        for ($i = 0; $i < $length; $i++) {
            $char = $sql[$i];
            $currentStatement .= $char;

            // Handle quotes
            if ($char === "'" && ($i === 0 || $sql[$i - 1] !== '\\')) {
                $inSingleQuote = ! $inSingleQuote;
            } elseif ($char === '"' && ($i === 0 || $sql[$i - 1] !== '\\')) {
                $inDoubleQuote = ! $inDoubleQuote;
            }

            // End of statement if we find a semicolon outside of quotes
            if ($char === ';' && ! $inSingleQuote && ! $inDoubleQuote) {
                $statements[] = trim($currentStatement);
                $currentStatement = '';
            }
        }

        // Add the last statement if there is one (without a trailing semicolon)
        if (! empty($currentStatement)) {
            $statements[] = trim($currentStatement);
        }

        // Remove empty statements
        return array_filter($statements, function ($stmt) {
            return ! empty(trim($stmt));
        });
    }

    /**
     * Helper function to interpolate query values for logging.
     */
    private function interpolateQuery(string $query, array $values): string
    {
        $interpolated = $query;
        foreach ($values as $value) {
            $value = is_null($value) ? 'NULL' : "'".addslashes($value)."'";
            $position = strpos($interpolated, '?');
            if ($position !== false) {
                $interpolated = substr_replace($interpolated, $value, $position, 1);
            }
        }

        return $interpolated;
    }
}
