<?php

namespace App\Http\Controllers\Postgres;

use App\Http\Controllers\Controller;
use App\Models\DatabaseConnection;
use App\Services\Databases\PostgresConnectionManager;
use App\Services\Databases\PostgresService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PostgresConnectionController extends Controller
{
    /**
     * PostgreSQL Service
     *
     * @var PostgresService
     */
    protected $postgresService;

    /**
     * PostgreSQL Connection Manager
     *
     * @var PostgresConnectionManager
     */
    protected $connectionManager;

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct(
        PostgresService $postgresService,
        PostgresConnectionManager $connectionManager
    ) {
        $this->postgresService = $postgresService;
        $this->connectionManager = $connectionManager;
    }

    /**
     * Display the list of PostgreSQL connections.
     *
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $connections = DatabaseConnection::where('type', 'postgres')
            ->where('user_id', $request->user()->id)
            ->get();

        // Test connection status for each connection
        $connectionsWithStatus = $connections->map(function ($connection) {
            try {
                $credentials = [
                    'host' => $connection->host,
                    'port' => $connection->port,
                    'username' => $connection->username,
                    'password' => $connection->password,
                    'database' => $connection->database,
                ];

                $isOnline = $this->connectionManager->testConnection($credentials);
                $connection->connection_status = $isOnline;
                $connection->last_tested = now();
            } catch (\Exception $e) {
                $connection->connection_status = false;
                $connection->connection_error = $e->getMessage();
                $connection->last_tested = now();
            }

            return $connection;
        });

        return Inertia::render('postgres/postgres', [
            'connections' => $connectionsWithStatus,
        ]);
    }

    /**
     * Test a PostgreSQL connection.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function testConnection(Request $request)
    {
        $request->validate([
            'host' => 'required|string|max:255',
            'port' => 'required|integer|min:1|max:65535',
            'username' => 'required|string|max:255',
            'password' => 'required|string|max:255',
            'database' => 'required|string|max:255',
        ]);

        try {
            $credentials = $request->only(['host', 'port', 'username', 'password', 'database']);
            $success = $this->connectionManager->testConnection($credentials);

            return response()->json(['success' => $success]);
        } catch (QueryException $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Store a new PostgreSQL connection.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'host' => 'required|string|max:255',
            'port' => 'required|integer|min:1|max:65535',
            'username' => 'required|string|max:255',
            'password' => 'required|string|max:255',
            'database' => 'required|string|max:255',
        ]);

        // Ensure the connection is created for the authenticated user only
        $connection = DatabaseConnection::create([
            'name' => $request->input('name'),
            'host' => $request->input('host'),
            'port' => $request->input('port'),
            'username' => $request->input('username'),
            'password' => $request->input('password'),
            'database' => $request->input('database'),
            'type' => 'postgres',
            'user_id' => $request->user()->id,
        ]);

        return redirect()->route('postgres.explore', $connection->ulid)
            ->with('success', 'Connection created successfully');
    }

    /**
     * Display the database explorer for a specific connection.
     *
     * @return \Inertia\Response
     */
    public function explore(DatabaseConnection $connection, Request $request)
    {
        // Ensure the user can only access their own connections
        if ($connection->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized action.');
        }

        try {
            // Update metadata before displaying explorer
            $this->connectionManager->updateMetadata($connection);

            return Inertia::render('postgres/explorer', [
                'connection' => $connection,
                'error' => null,
            ]);
        } catch (QueryException $e) {
            return Inertia::render('postgres/explorer', [
                'connection' => $connection,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get schemas for a specific database.
     *
     * @param  string  $database
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSchemas(Request $request, DatabaseConnection $connection, $database)
    {
        // Ensure the user can only access their own connections
        if ($connection->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        try {
            $schemas = $this->postgresService->getSchemas($connection, $database);

            return response()->json($schemas);
        } catch (QueryException $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get tables for a specific database.
     *
     * @param  string  $database
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTables(Request $request, DatabaseConnection $connection, $database)
    {
        // Ensure the user can only access their own connections
        if ($connection->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        try {
            $tables = $this->postgresService->getTables($connection, $database);

            return response()->json($tables);
        } catch (QueryException $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get columns for a specific table.
     *
     * @param  string  $database
     * @param  string  $table
     * @return \Illuminate\Http\JsonResponse
     */
    public function getColumns(Request $request, DatabaseConnection $connection, $database, $table)
    {
        // Ensure the user can only access their own connections
        if ($connection->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        $schema = $request->query('schema', 'public');

        try {
            $columns = $this->postgresService->getTableColumns($connection, $table, $database, $schema);

            return response()->json($columns);
        } catch (QueryException $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get data for a specific table with pagination.
     *
     * @param  string  $database
     * @param  string  $table
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTableData(Request $request, DatabaseConnection $connection, $database, $table)
    {
        // Ensure the user can only access their own connections
        if ($connection->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        $page = $request->get('page', 1);
        $perPage = $request->get('perPage', 20);
        $schema = $request->query('schema', 'public');

        // Get and process filters
        $rawFilters = $request->query('filters', []);
        $filters = $this->processFilters($rawFilters);

        // Get and process sorting options
        $rawSorting = $request->query('sorting', []);
        $sorting = $this->processSorting($rawSorting);

        try {
            $data = $this->postgresService->getTableData(
                $connection,
                $database,
                $table,
                $page,
                $perPage,
                $schema,
                $filters,
                $sorting
            );

            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Insert a new row into a table.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function insertRow(Request $request, DatabaseConnection $connection)
    {
        // Ensure the user can only access their own connections
        if ($connection->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        $request->validate([
            'database' => 'required|string',
            'schema' => 'required|string',
            'table' => 'required|string',
            'data' => 'required|array',
        ]);

        try {
            $result = $this->postgresService->insertRow(
                $connection,
                $request->input('database'),
                $request->input('schema'),
                $request->input('table'),
                $request->input('data'),
                $request->user()->id
            );

            return response()->json([
                'success' => $result,
                'message' => 'Row inserted successfully',
            ]);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Process and validate input filters.
     *
     * @param  mixed  $rawFilters
     */
    private function processFilters($rawFilters): array
    {
        $filters = [];

        // Handle both string JSON and array formats
        if (is_string($rawFilters)) {
            try {
                $filters = json_decode($rawFilters, true) ?? [];
            } catch (\Exception $e) {
                $filters = [];
            }
        } else {
            $filters = $rawFilters;
        }

        // Validate filter structure
        $validFilters = [];
        foreach ($filters as $filter) {
            // Ensure each filter has required properties
            if (! isset($filter['column']) || ! isset($filter['operator'])) {
                continue;
            }

            // Validate operator is in allowed list
            $allowedOperators = [
                'eq',
                'neq',
                'gt',
                'gte',
                'lt',
                'lte',
                'like',
                'ilike',
                'is',
                'is_not',
                'between',
                'not_between',
                'in',
                'not_in',
                'is_null',
                'is_not_null',
            ];

            if (! in_array($filter['operator'], $allowedOperators)) {
                continue;
            }

            // Process value based on operator
            if (in_array($filter['operator'], ['is_null', 'is_not_null'])) {
                // These operators don't need values
                $validFilters[] = [
                    'column' => $filter['column'],
                    'operator' => $filter['operator'],
                ];
            } elseif (in_array($filter['operator'], ['between', 'not_between'])) {
                // Between operators need array values with exactly 2 items
                if (isset($filter['value']) && is_array($filter['value']) && count($filter['value']) === 2) {
                    $validFilters[] = $filter;
                }
            } elseif (in_array($filter['operator'], ['in', 'not_in'])) {
                // In operators need array values
                if (isset($filter['value']) && is_array($filter['value']) && ! empty($filter['value'])) {
                    $validFilters[] = $filter;
                }
            } else {
                // Standard operators need a value
                if (isset($filter['value'])) {
                    $validFilters[] = $filter;
                }
            }
        }

        return $validFilters;
    }

    /**
     * Process and validate sorting options.
     *
     * @param  mixed  $rawSorting
     */
    private function processSorting($rawSorting): array
    {
        $sorting = [];

        // Handle both string JSON and array formats
        if (is_string($rawSorting)) {
            try {
                $sorting = json_decode($rawSorting, true) ?? [];
            } catch (\Exception $e) {
                $sorting = [];
            }
        } else {
            $sorting = $rawSorting;
        }

        // Validate sorting structure
        $validSorting = [];
        foreach ($sorting as $sort) {
            // Ensure each sort option has required properties
            if (! isset($sort['column']) || ! isset($sort['direction'])) {
                continue;
            }

            // Validate direction is either asc or desc
            if (! in_array(strtolower($sort['direction']), ['asc', 'desc'])) {
                continue;
            }

            $validSorting[] = [
                'column' => $sort['column'],
                'direction' => strtolower($sort['direction']),
            ];
        }

        return $validSorting;
    }
}
